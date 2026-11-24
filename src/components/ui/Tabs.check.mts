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
const canonical = await import(url('src/components/ui/Tabs.tsx'));
const legacy = await import(url('src/components/ui/lovable/tabs.tsx'));
for (const name of ['Tabs', 'TabsList', 'TabsTrigger', 'TabsContent']) {
 assert.ok(canonical[name], `${name} must be exported`);
 assert.strictEqual(canonical[name], legacy[name], `${name} must share one implementation`);
}
const { Tabs, TabsList, TabsTrigger, TabsContent } = canonical;
function fixture(variant: "segmented" | "underline", props: Record<string, unknown> = {}) {
 return h(Tabs, {defaultValue:'one', variant, ...props},
  h(TabsList, {'aria-label':'Records'},
   h(TabsTrigger, {value:'one'}, 'One'), h(TabsTrigger, {value:'two',disabled:true}, 'Two')),
  h(TabsContent, {value:'one'}, 'First panel'), h(TabsContent, {value:'two'}, 'Second panel'));
}
for (const variant of ['segmented', 'underline'] as const) {
 const html = renderToStaticMarkup(fixture(variant));
 for (const part of ['role="tablist"','aria-label="Records"','role="tab"','aria-selected="true"','aria-controls=','role="tabpanel"','aria-labelledby=','First panel']) assert.ok(html.includes(part), part);
 assert.ok(!html.includes('Second panel'), 'inactive panel content must be unmounted');
 assert.ok(html.includes('disabled=""'), 'disabled trigger must remain disabled');
 if (variant === 'underline') assert.ok(html.includes('border-b-2') && html.includes('pt-4'), 'underline presentation');
 else assert.ok(html.includes('bg-muted') && html.includes('rounded-lg'), 'segmented presentation');
 const controlled = renderToStaticMarkup(fixture(variant, {value:'two',onValueChange:()=>{}}));
 assert.ok(controlled.includes('Second panel') && !controlled.includes('First panel'), 'controlled value selects panel');
}
const override = renderToStaticMarkup(h(Tabs,{defaultValue:'a'},h(TabsList,{className:'h-10 bg-transparent'},h(TabsTrigger,{value:'a',className:'rounded-none data-[state=active]:bg-primary'},'A'))));
assert.ok(override.includes('h-10') && !override.includes('h-9'), 'list height override');
assert.ok(override.includes('data-[state=active]:bg-primary') && !override.includes('data-[state=active]:bg-background'), 'active surface override');
console.log('PASS: canonical identity, both variants, controlled/default panel, unmounting, ARIA/disabled and caller overrides');
