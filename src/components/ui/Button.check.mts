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
const canonical=await import(url('src/components/ui/Button.tsx'));
const {Button,buttonClasses,buttonVariants}=canonical;
const defaults=renderToStaticMarkup(h(Button,null,'Continue'));
assert.ok(defaults.includes('h-8') && defaults.includes('rounded-lg'),'default is 32px with 12px radius');
assert.ok(defaults.includes('text-sm'),'default text remains 14px');
assert.ok(defaults.includes('type="button"'),'implicit button cannot submit a form');
const legacy=await import(url('src/components/ui/lovable/button.tsx'));
assert.strictEqual(Button,legacy.Button,'one renderer');
assert.strictEqual(buttonVariants,legacy.buttonVariants,'one variants helper');
assert.equal(buttonVariants({variant:'primary'}),buttonVariants({variant:'default'}),'primary/default aliases');
assert.ok(buttonVariants({variant:'secondary'}).includes('bg-secondary'),'filled secondary remains');
assert.ok(buttonVariants({variant:'outline'}).includes('bg-card'),'outline remains bordered card');
assert.ok(buttonClasses('secondary').includes('bg-card') && !buttonClasses('secondary').includes('bg-secondary'),'old positional secondary stays outline');
for(const [size,height] of Object.entries({default:'h-8',sm:'h-8',lg:'h-11',icon:'h-9','icon-sm':'h-8'})) {
 const rendered=renderToStaticMarkup(h(Button,{size},size));
 assert.ok(rendered.includes(height) && rendered.includes('rounded-lg'),size);
}
const overrides=buttonVariants({className:'h-11 px-1 text-lg rounded-none'});
for(const part of ['h-11','px-1','text-lg','rounded-none']) assert.ok(overrides.includes(part),part);
for(const part of ['h-8','px-3','text-sm','rounded-lg']) assert.ok(!overrides.split(' ').includes(part),'removed '+part);
assert.ok(!buttonVariants({variant:null,size:null}).includes('h-8'),'null size has no size default');
assert.ok(!buttonVariants({variant:null,size:null}).includes('bg-primary'),'null variant has no color default');
const onClick=()=>{}, ref={current:null};
const tree=Button.render({disabled:true,title:'Unavailable',onClick,'aria-label':'Action'},ref);
for(const [key,value] of Object.entries({ref,disabled:true,title:'Unavailable',onClick,type:'button','aria-label':'Action'})) assert.strictEqual(tree.props[key],value,key);
assert.ok(!tree.props.className.includes('disabled:pointer-events-none'),'native disabled hover/title preserved');
const submit=renderToStaticMarkup(h(Button,{type:'submit',form:'record-form',name:'action',value:'save',disabled:true},'Save'));
for(const part of ['type="submit"','form="record-form"','name="action"','value="save"','disabled=""']) assert.ok(submit.includes(part),part);
const reset=renderToStaticMarkup(h(Button,{type:'reset'},'Reset'));
assert.ok(reset.includes('type="reset"'),'explicit reset');
const link=renderToStaticMarkup(h(Button,{asChild:true,variant:'outline','aria-label':'Open record'},h('a',{href:'#record'},'Open')));
assert.ok(link.startsWith('<a ') && link.includes('href="#record"') && link.includes('aria-label="Open record"'),'Slot forwards link props');
assert.ok(!link.includes('<button') && !link.includes('type="button"'),'link has no nested button/type');
console.log('PASS: shared Button, 32/12/14 defaults, sizes/null, variants/legacy helper, override merging, ref/native/form props and asChild links');
