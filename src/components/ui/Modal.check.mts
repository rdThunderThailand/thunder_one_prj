import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
// Run from the repository root with Node 24+ (registerHooks transpiles the real TSX modules).
const root = process.cwd();
const require = createRequire(pathToFileURL(resolve(root, 'package.json')));
const ts = require('typescript');
const { registerHooks } = require('node:module');
const { createElement: h } = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
registerHooks({
 resolve(specifier: string, context: { parentURL?: string }, next: (specifier: string, context: { parentURL?: string }) => unknown) {
  // SSR cannot render portals; keep their children transparent for structural assertions only.
  if (specifier === '@radix-ui/react-portal') {
   const reactUrl = pathToFileURL(require.resolve('react')).href;
   return {url:'data:text/javascript,'+encodeURIComponent(`import React from '${reactUrl}'; export const Portal = React.forwardRef(({children}, ref) => children);`),shortCircuit:true};
  }
  let path: string | undefined;
  if (specifier.startsWith('@/')) path = resolve(root, 'src', specifier.slice(2));
  else if (specifier.startsWith('.') && context.parentURL?.startsWith(pathToFileURL(resolve(root, 'src')).href)) path = fileURLToPath(new URL(specifier, context.parentURL));
  if (path && !extname(path)) {
   for (const suffix of ['.tsx','.ts','/index.tsx','/index.ts']) if (existsSync(path+suffix)) return next(pathToFileURL(path+suffix).href,context);
  }
  if (context.parentURL?.startsWith(pathToFileURL(resolve(root,'src')).href) && specifier.startsWith('next/') && existsSync(resolve(root,'node_modules',specifier+'.js'))) return next(pathToFileURL(resolve(root,'node_modules',specifier+'.js')).href,context);
  return next(specifier,context);
 },
 load(url: string, context: unknown, next: (url: string, context: unknown) => unknown) {
  if (!url.startsWith(pathToFileURL(resolve(root,'src')).href) || !/\.tsx?$/.test(url)) return next(url,context);
  return {format:'module',shortCircuit:true,source:ts.transpileModule(readFileSync(new URL(url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText};
 }
});

const url = (path: string) => pathToFileURL(resolve(root,path)).href;
const { Modal } = await import(url('src/components/ui/Modal.tsx'));
const props = {open:true,onClose:()=>{},title:'Edit record',description:'Record details',footer:h('button',{type:'submit',form:'record-form'},'Save'),children:h('form',{id:'record-form'},h('input',{required:true,name:'record-name'}))};
const html = renderToStaticMarkup(h(Modal,props));
assert.ok(!html.includes('<dialog'), 'Modal must use the shared Radix foundation, not native dialog');
for(const part of ['role="dialog"','Edit record','Record details','form="record-form"','id="record-form"','required=""','max-w-md','overflow-y-auto']) assert.ok(html.includes(part),part);
assert.ok(!html.includes('aria-label="Close"'), 'Modal close button is opt-in');
assert.ok(!html.includes('sr-only">Close'), 'compound close button must not leak into Modal');
assert.equal(renderToStaticMarkup(h(Modal,{...props,open:false})), '', 'closed children unmount');
for(const [size,cls] of Object.entries({md:'max-w-md',lg:'max-w-2xl',form:'max-w-3xl',xl:'max-w-6xl',preview:'max-w-[90rem]'})) {
 assert.ok(renderToStaticMarkup(h(Modal,{...props,size})).includes(cls),size);
}
const hidden = renderToStaticMarkup(h(Modal,{...props,hideTitle:true,showCloseButton:true,titleClassName:'text-2xl',overflowVisible:true}));
for(const part of ['class="sr-only"','aria-label="Close"','text-2xl','overflow-visible']) assert.ok(hidden.includes(part),part);
const canonical = await import(url('src/components/ui/Dialog.tsx'));
const legacy = await import(url('src/components/ui/lovable/dialog.tsx'));
for(const name of ['Dialog','DialogPortal','DialogOverlay','DialogTrigger','DialogClose','DialogContent','DialogHeader','DialogFooter','DialogTitle','DialogDescription']) assert.strictEqual(canonical[name],legacy[name],name);
const compound=renderToStaticMarkup(h(canonical.Dialog,{open:true},h(canonical.DialogContent,null,h(canonical.DialogTitle,null,'Compound title'),h(canonical.DialogDescription,null,'Compound details'))));
assert.ok(compound.includes('sr-only">Close') && compound.includes('max-w-lg'), 'compound close/default size retained');
console.log('PASS: shared Dialog identity, Modal semantics/closed state, sizes, form ownership and title/close/overflow options');
