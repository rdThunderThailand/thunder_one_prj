import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Node 24+, from repository root. Exercise the actual component with deterministic
// hook/route seams; browser verification owns focus, portals and responsive CSS.
const root = process.cwd();
const require = createRequire(pathToFileURL(resolve(root, 'package.json')));
const { registerHooks } = require('node:module');
const ts = require('typescript');
const src = pathToFileURL(resolve(root, 'src')).href;
const target = pathToFileURL(resolve(root, 'src/components/layout/MobileNavigation.tsx')).href;
let pathname = '/people';
let state: unknown = null;
let dirty = false;
let effect: (() => void | (() => void)) | undefined;
let cleanup: void | (() => void);
const seam = {
  usePathname: () => pathname,
  useState: () => [state, (value: unknown) => { dirty ||= !Object.is(state, value); state = value; }],
  useEffect: (callback: () => void | (() => void)) => { effect ??= callback; },
};
Object.defineProperty(globalThis, '__mobileNavigationCheck', { value: seam, configurable: true });
const stub = (source: string) => `data:text/javascript,${encodeURIComponent(source)}`;
const hooks = stub('const s=globalThis.__mobileNavigationCheck; export const useState=s.useState,useEffect=s.useEffect;');
const route = stub('export const usePathname=globalThis.__mobileNavigationCheck.usePathname;');
const sidebar = stub('export function Sidebar() { throw new Error("Sidebar must only be inspected, not rendered"); }');
registerHooks({
  resolve(specifier: string, context: { parentURL?: string }, next: (specifier: string, context: { parentURL?: string }) => unknown) {
    if (context.parentURL === target) {
      if (specifier === 'react') return { url: hooks, shortCircuit: true };
      if (specifier === 'next/navigation') return { url: route, shortCircuit: true };
      if (specifier === './Sidebar') return { url: sidebar, shortCircuit: true };
    }
    let path: string | undefined;
    if (specifier.startsWith('@/')) path = resolve(root, 'src', specifier.slice(2));
    else if (specifier.startsWith('.') && context.parentURL?.startsWith(src)) path = fileURLToPath(new URL(specifier, context.parentURL));
    if (path && !extname(path)) {
      for (const suffix of ['.tsx', '.ts', '/index.tsx', '/index.ts']) {
        if (existsSync(path + suffix)) return next(pathToFileURL(path + suffix).href, context);
      }
    }
    return next(specifier, context);
  },
  load(url: string, context: unknown, next: (url: string, context: unknown) => unknown) {
    if (!url.startsWith(src) || !/\.tsx?$/.test(url)) return next(url, context);
    return { format: 'module', shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext },
    }).outputText };
  },
});
const { MobileNavigation, MobileNavigationTrigger } = await import(target);
const dialog = await import(pathToFileURL(resolve(root, 'src/components/ui/Dialog.tsx')).href);
const { Button } = await import(pathToFileURL(resolve(root, 'src/components/ui/Button.tsx')).href);
const { Sidebar } = await import(sidebar);
type Tree = { type: unknown; props: Record<string, unknown> & { children?: Tree | Tree[] } };
const children = (tree: Tree) => (Array.isArray(tree.props.children) ? tree.props.children : [tree.props.children]).filter((child): child is Tree => !!child);
const sidebarProps = { tenantId: 'tenant-check', tenantName: 'Check', availableTenants: [] };
const page = { type: 'main', props: { children: 'Page' } };
function render(): Tree {
  for (let attempt = 0; attempt < 5; attempt++) {
    dirty = false;
    const tree: Tree = MobileNavigation({ sidebarProps, children: page });
    if (!dirty) return tree;
  }
  throw new Error('Render-time state adjustment did not settle');
}
const changeOpen = (tree: Tree, open: boolean) => (tree.props.onOpenChange as (open: boolean) => void)(open);
const tree = render();
assert.equal(tree.type, dialog.Dialog);
assert.equal(tree.props.open, false);
const [desktop, drawer, content] = children(tree);
assert.equal(content, page, 'page remains within the Dialog context');
assert.match(String(desktop.props.className), /hidden.*md:block/);
assert.equal(children(desktop)[0].type, Sidebar);
assert.equal(children(desktop)[0].props.tenantId, sidebarProps.tenantId);
assert.equal(children(desktop)[0].props.isMobile, undefined);
assert.equal(drawer.type, dialog.DialogContent);
assert.equal(drawer.props.showCloseButton, false);
assert.equal(drawer.props['aria-describedby'], undefined);
assert.match(String(drawer.props.className), /h-dvh.*max-w-full/);
assert.match(String(drawer.props.overlayClassName), /closed.*animate-none!/);
const [title, close, nav] = children(drawer);
assert.equal(title.type, dialog.DialogTitle);
assert.equal(title.props.className, 'sr-only');
assert.equal(close.type, dialog.DialogClose);
assert.equal(children(close)[0].props['aria-label'], 'Close navigation');
assert.equal(children(nav)[0].type, Sidebar);
assert.equal(children(nav)[0].props.isMobile, true);
assert.equal(children(nav)[0].props.tenantId, sidebarProps.tenantId);
const trigger: Tree = MobileNavigationTrigger();
assert.equal(trigger.type, dialog.DialogTrigger);
assert.equal(trigger.props.asChild, true);
assert.equal(children(trigger)[0].type, Button);
assert.equal(children(trigger)[0].props['aria-label'], 'Open navigation');
assert.match(String(children(trigger)[0].props.className), /md:hidden/);

changeOpen(tree, true);
assert.equal(render().props.open, true, 'trigger opens current route');
pathname = '/care';
assert.equal(render().props.open, false, 'route change closes drawer');
pathname = '/people';
assert.equal(render().props.open, false, 'returning to old route must not reopen drawer');
changeOpen(render(), true);
changeOpen(render(), false);
assert.equal(render().props.open, false, 'Dialog close clears open state');

class ClickTarget {
  private readonly link: boolean;
  constructor(link: boolean) { this.link = link; }
  closest(selector: string) { assert.equal(selector, 'a[href]'); return this.link ? this : null; }
}
const elementDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Element');
const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
let listener: (() => void) | undefined;
let removed = false;
const media = {
  matches: false,
  addEventListener: (name: string, callback: () => void) => { assert.equal(name, 'change'); listener = callback; },
  removeEventListener: (name: string, callback: () => void) => { assert.equal(name, 'change'); assert.equal(callback, listener); removed = true; },
};
try {
  Object.defineProperty(globalThis, 'Element', { value: ClickTarget, configurable: true });
  Object.defineProperty(globalThis, 'window', { value: { matchMedia: (query: string) => { assert.equal(query, '(min-width: 768px)'); return media; } }, configurable: true });
  const click = nav.props.onClickCapture as (event: { target: unknown }) => void;
  changeOpen(render(), true);
  click({ target: new ClickTarget(false) });
  assert.equal(render().props.open, true, 'non-link click does not close navigation');
  click({ target: new ClickTarget(true) });
  assert.equal(render().props.open, false, 'nested anchor target closes navigation, including same-route links');
  assert.ok(effect);
  cleanup = effect();
  assert.ok(listener);
  changeOpen(render(), true);
  listener();
  assert.equal(render().props.open, true, 'mobile breakpoint event preserves drawer');
  media.matches = true;
  listener();
  assert.equal(render().props.open, false, 'desktop breakpoint clears drawer');
  media.matches = false;
  listener();
  assert.equal(render().props.open, false, 'returning to mobile does not reopen drawer');
  assert.equal(typeof cleanup, 'function');
  cleanup?.();
  assert.equal(removed, true, 'unmount removes media listener');
} finally {
  for (const [name, descriptor] of [['Element', elementDescriptor], ['window', windowDescriptor]] as const) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }
  Reflect.deleteProperty(globalThis, '__mobileNavigationCheck');
}
console.log('PASS: MobileNavigation composition, accessible triggers, route/link close, breakpoint lifecycle and cleanup');
