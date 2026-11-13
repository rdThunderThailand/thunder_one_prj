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
const createElement = h;

// skeleton contract, retained from its verified family slice.
{
  const paths = ['src/components/ui/Skeleton.tsx', 'src/components/ui/lovable/skeleton.tsx', 'src/lib/utils.ts'];
  const urls = paths.map(url);
  const { Skeleton: shared } = await import(urls[0]);
  const { Skeleton: primitive } = await import(urls[1]);
  assert.strictEqual(shared, primitive, 'both import paths must expose one implementation');
  assert.equal(primitive({}).props.className, 'animate-pulse rounded-xs bg-muted');
  for (const radius of ['rounded-full', 'rounded-lg', 'rounded-xl', 'rounded-[14px]', 'rounded-2xl']) {
    const classes = primitive({ className: `${radius} bg-success h-8` }).props.className.split(' ');
    assert.ok(classes.includes(radius) && classes.includes('bg-success') && classes.includes('h-8'));
    assert.ok(!classes.includes('rounded-xs') && !classes.includes('bg-muted'), 'caller style must override defaults');
  }
  const onClick = () => {};
  const style = { width: 37 };
  const props = { id: 'skeleton-check', 'aria-hidden': true, 'data-state': 'loading', style, onClick };
  assert.strictEqual(shared(props).props.onClick, onClick);
  assert.strictEqual(shared(props).props.style, style);
  const html = renderToStaticMarkup(createElement(shared, props));
  for (const fragment of ['id="skeleton-check"', 'aria-hidden="true"', 'data-state="loading"', 'width:37px']) {
    assert.ok(html.includes(fragment), `missing forwarded prop: ${fragment}`);
  }
  assert.ok(!html.includes('role="status"'), 'primitive must not duplicate loading-wrapper announcements');
  console.log('PASS: shared identity, neutral/4px classes, caller overrides, HTML props and status-wrapper boundary');
}

// progress contract, retained from its verified family slice.
{
  const paths = ['src/components/ui/ProgressBar.tsx', 'src/components/ui/lovable/progress.tsx', 'src/lib/utils.ts'];
  const urls = paths.map(url);
  const { ProgressBar } = await import(urls[0]);
  const { Progress } = await import(urls[1]);
  assert.strictEqual(ProgressBar, Progress, 'both imports must expose one progress implementation');
  assert.equal(ProgressBar({}).props['aria-valuenow'], 0, 'legacy optional value defaults to zero');
  for (const [input, expected] of [[-20,0],[0,0],[37,37],[100,100],[140,100]]) {
    const el = ProgressBar({ value: input });
    assert.equal(el.props.role, 'progressbar');
    assert.equal(el.props['aria-valuenow'], expected);
    assert.equal(el.props['aria-valuemin'], 0);
    assert.equal(el.props['aria-valuemax'], 100);
    assert.equal(el.props.children.props.style.width, `${expected}%`);
  }
  for (const [color, expected] of [['indigo','bg-primary'],['emerald','bg-success'],['red','bg-error'],['amber','bg-warning']]) {
   assert.ok(ProgressBar({ value: 42, color }).props.children.props.className.split(' ').includes(expected));
  }
  const el = ProgressBar({value:42, animated:true, className:'h-1 w-20', id:'progress-check', 'aria-label':'Delivery', style:{marginTop:3}});
  assert.ok(el.props.className.split(' ').includes('h-1') && !el.props.className.split(' ').includes('h-1.5'));
  assert.ok(el.props.className.split(' ').includes('w-20') && !el.props.className.split(' ').includes('w-full'));
  assert.ok(el.props.children.props.className.includes('progress-stripes'));
  assert.ok(!ProgressBar({value:42}).props.children.props.className.includes('progress-stripes'));
  const html = renderToStaticMarkup(createElement(ProgressBar, {value:42,id:'progress-check','aria-label':'Delivery',style:{marginTop:3},onClick:()=>{}}));
  for (const fragment of ['id="progress-check"','aria-label="Delivery"','margin-top:3px','width:42%']) assert.ok(html.includes(fragment), fragment);
  console.log('PASS: shared progress identity, optional zero, clamp/ARIA, colors/stripes, size overrides and HTML props');
}

// input contract, retained from its verified family slice.
{
  const paths = ['src/components/ui/Input.tsx', 'src/components/ui/lovable/input.tsx', 'src/lib/utils.ts', 'src/components/ui/TextField.tsx'];
  const urls = paths.map(url);
  const { Input } = await import(urls[0]);
  const { Input: Legacy } = await import(urls[1]);
  assert.strictEqual(Input, Legacy, 'both paths must share the native input renderer');
  const { TextField } = await import(urls[3]);
  const ref = { current: null };
  const onChange = () => {};
  const input = Input.render({ type:'file', multiple:true, required:true, disabled:true, id:'files', name:'files', 'aria-label':'Files', className:'h-9 w-36 pl-9 text-xs', onChange }, ref);
  assert.equal(input.type, 'input');
  for (const [key,value] of Object.entries({type:'file',multiple:true,required:true,disabled:true,id:'files',name:'files','aria-label':'Files',onChange,ref})) assert.strictEqual(input.props[key],value,key);
  const classes=input.props.className.split(' ');
  for(const c of ['h-9','w-36','pl-9','text-xs','rounded-(--radius-control)','bg-card']) assert.ok(classes.includes(c),c);
  assert.ok(!classes.includes('h-(--spacing-control)') && !classes.includes('w-full'));
  const override=Input.render({className:'rounded-lg'},null).props.className.split(' ');
  assert.ok(override.includes('rounded-lg') && !override.includes('rounded-(--radius-control)'));
  const defaults=Input.render({},null).props.className.split(' ');
  assert.ok(defaults.includes('h-(--spacing-control)') && defaults.includes('rounded-(--radius-control)'));
  for(const type of ['text','email','password','search','date','time','file']) {
   const html=renderToStaticMarkup(createElement(Input,{type,required:true,readOnly:type!=='file',maxLength:120,'aria-label':type}));
   assert.ok(html.includes(`type="${type}"`) && html.includes('required=""'));
  }
  const fieldRef={current:null};
  const field=TextField.render({label:'Email',name:'email',type:'email',required:true,error:'Enter an email','aria-describedby':'email-help',className:'h-9'},fieldRef);
  const fieldInput=field.props.children.find((child: { type?: unknown } | null)=>child?.type===Input);
  assert.strictEqual(fieldInput.props.ref,fieldRef);
  assert.equal(fieldInput.props['aria-invalid'],true);
  assert.ok(fieldInput.props['aria-describedby'].split(' ').includes('email-error'));
  assert.ok(fieldInput.props['aria-describedby'].split(' ').includes('email-help'));
  const errorHtml=renderToStaticMarkup(createElement(TextField,{label:'Email',name:'email',error:'Enter an email'}));
  for(const fragment of ['for="email"','id="email"','aria-invalid="true"','aria-describedby="email-error"','id="email-error"','Enter an email']) assert.ok(errorHtml.includes(fragment),fragment);
  const valid=renderToStaticMarkup(createElement(TextField,{label:'Name',id:'custom',name:'name'}));
  assert.ok(valid.includes('for="custom"') && valid.includes('id="custom"') && !valid.includes('custom-error'));
  console.log('PASS: input identity/defaults/overrides, native types/flags/events/refs, TextField label/error/descriptions');
}

// search-input contract, retained from its verified family slice.
{
  const { SearchInput } = await import(url('src/components/ui/SearchInput.tsx'));
  const { SearchInput: Legacy } = await import(url('src/components/ui/lovable/core.tsx'));
  assert.strictEqual(SearchInput, Legacy, 'both SearchInput paths must expose one implementation');
  const { Input } = await import(url('src/components/ui/Input.tsx'));
  const ref={current:null},onChange=()=>{};
  const tree=SearchInput.render({value:'query',onChange,label:'Media search',className:'w-64',placeholder:'Find media',disabled:true,name:'q'},ref);
  const input=tree.props.children.find((child: { type?: unknown } | null)=>child?.type===Input);
  assert.ok(input,'must use canonical ui/Input');
  for(const [key,value] of Object.entries({ref,onChange,value:'query',name:'q',disabled:true,type:'search',role:'searchbox','aria-label':'Media search'})) assert.strictEqual(input.props[key],value,key);
  assert.ok(tree.props.className.split(' ').includes('w-64') && !tree.props.className.split(' ').includes('w-full'));
  const icon=tree.props.children.find((child: { type?: unknown } | null)=>child?.type!==Input);
  assert.equal(String(icon.props['aria-hidden']),'true');
  assert.ok(icon.props.className.includes('pointer-events-none'));
  for(const [props,label] of [[{},'Search anything...'],[{placeholder:'Find records'},'Find records'],[{label:'Explicit',placeholder:'Find'},'Explicit'],[{'aria-label':'Native name',placeholder:'Find'},'Native name']] as const) {
   const html=renderToStaticMarkup(h(SearchInput,props));
   assert.ok(html.includes(`aria-label="${label}"`),label);
   assert.ok(html.includes('type="search"') && html.includes('role="searchbox"'));
  }
  const html=renderToStaticMarkup(h(SearchInput,{defaultValue:'initial',required:true,'aria-describedby':'hint'}));
  for(const fragment of ['value="initial"','required=""','aria-describedby="hint"']) assert.ok(html.includes(fragment),fragment);
  console.log('PASS: SearchInput identity, canonical primitive, controlled/ref/native props, naming/icon and wrapper widths');
}

// empty-state contract, retained from its verified family slice.
{
  const {EmptyState,ErrorState}=await import(url('src/components/ui/EmptyState.tsx'));
  const {EmptyState:LegacyEmpty,ErrorState:LegacyError}=await import(url('src/components/ui/lovable/core.tsx'));
  assert.strictEqual(ErrorState,LegacyError,'both ErrorState paths must share one implementation');
  assert.equal(typeof ErrorState,'function','canonical ErrorState must exist');
  const Icon=(props: Record<string, unknown>)=>h('svg',props);
  let calls=0;
  const action=h('button',{type:'button',onClick:()=>{calls+=1;}},'Retry');
  const props={icon:Icon,title:'No <items>',detail:'Try another filter',action,compact:true,className:'min-h-20'};
  const tree=EmptyState(props),inner=tree.props.children;
  assert.equal(inner.props.children[1].type,'h3');
  assert.equal(String(inner.props.children[0].props['aria-hidden']),'true');
  assert.strictEqual(inner.props.children[3].props.children,action,'action node must reach rendered output');
  assert.equal(calls,0,'render must not invoke action');
  inner.props.children[3].props.children.props.onClick();assert.equal(calls,1);
  assert.ok(tree.props.className.includes('min-h-20') && !tree.props.className.includes('min-h-28'));
  const legacy=LegacyEmpty({icon:Icon,title:'No items',description:'Description',action});
  assert.strictEqual(legacy.type,EmptyState);assert.equal(legacy.props.detail,'Description');assert.strictEqual(legacy.props.action,action);
  const error=ErrorState({description:'Try again',action,compact:true});
  assert.equal(error.props.role,'alert');assert.strictEqual(error.props.children.type,EmptyState);
  assert.equal(error.props.children.props.detail,'Try again');assert.strictEqual(error.props.children.props.action,action);
  const html=renderToStaticMarkup(h(EmptyState,props));
  assert.ok(html.includes('<h3')&&html.includes('No &lt;items&gt;')&&html.includes('Try another filter')&&html.includes('Retry'));
  assert.ok(!html.includes('role="alert"'),'empty state must not announce an error');
  const defaults=renderToStaticMarkup(h(ErrorState,{}));
  assert.equal((defaults.match(/role="alert"/g)||[]).length,1);
  assert.ok(defaults.includes('Something went wrong')&&defaults.includes('Try again or return to the previous page.'));
  console.log('PASS: shared error alias, legacy detail mapping, copy/escaping, compact overrides, action callbacks and heading/icon/alert semantics');
}
