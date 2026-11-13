import type { TagProps } from './Tag';
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
const { Badge } = await import(url('src/components/ui/Badge.tsx'));
const native = {children:'Online',lang:'th',id:'native-badge','data-source':'check',title:'State'};
const html = renderToStaticMarkup(h(Badge,native));
assert.ok(html.includes('lang="th"') && html.includes('id="native-badge"'), 'canonical Badge must forward native props');
assert.ok(html.includes('aria-hidden="true"'), 'status dot is decorative');
assert.ok(html.includes('text-2xs') && html.includes('bg-t1-gray-400'), 'canonical default uses approved 10px dot');
const onClick = () => {};
assert.strictEqual(Badge({...native,onClick}).props.onClick,onClick,'native event handler');
for(const [color,fill] of Object.entries({green:'success',yellow:'warning',red:'error',blue:'info',indigo:'in-progress',zinc:'muted'})) {
 const pill=renderToStaticMarkup(h(Badge,{color,variant:'pill'},color));
 assert.ok(pill.includes(`bg-${fill}`),color);
 assert.ok(pill.includes('text-2xs'),'pill uses approved10px default');
 assert.ok(!pill.includes('aria-hidden="true"'),'pill does not gain a dot');
}
const canonical=await import(url('src/components/ui/Badge.tsx'));
const legacy=await import(url('src/components/ui/lovable/badge.tsx'));
assert.strictEqual(canonical.badgeVariants,legacy.badgeVariants,'legacy helper identity');
for(const variant of ['default','secondary','destructive','outline','success','warning','danger','info','neutral',null]) {
 const old=legacy.Badge({variant,children:'Legacy',lang:'th'});
 assert.strictEqual(old.type,Badge,'legacy uses canonical renderer');
 assert.strictEqual(old.props.variant,variant,'legacy variant including null');
 const rendered=renderToStaticMarkup(old);
 assert.ok(rendered.includes(canonical.badgeVariants({variant})),'tone classes remain compatible');
 assert.ok(rendered.includes('lang="th"'),'legacy native prop');
 assert.ok(rendered.includes('text-2xs'),'legacy tone uses approved10px default');
}
assert.equal(legacy.Badge({children:'Default'}).props.variant,'default','legacy default stays primary');
const {Tag}=await import(url('src/components/ui/Tag.tsx'));
const tag=renderToStaticMarkup(h(Tag,{lang:'th'},'Screen'));
for(const part of ['rounded-full','border-border','bg-card','text-muted-foreground','text-2xs','lang="th"']) assert.ok(tag.includes(part),part);
assert.ok(!tag.includes('bg-success') && !tag.includes('aria-hidden="true"'),'tag is neutral with no status dot');
const override=renderToStaticMarkup(h(Tag,{className:'px-1 py-0 text-[9px]'},'Screen'));
assert.ok(override.includes('px-1') && !override.includes('px-2.5'),'tag padding override');
assert.ok(override.includes('text-[9px]') && !override.includes('text-2xs'),'explicit caller font retained');
const core=await import(url('src/components/ui/lovable/core.tsx'));
assert.strictEqual(core.StatusBadge,canonical.StatusBadge,'StatusBadge alias identity');
for(const [status,tone] of Object.entries({active:'success',scheduled:'warning',draft:'info',offline:'danger',unrecognized:'neutral'})) {
 const rendered=renderToStaticMarkup(h(canonical.StatusBadge,{status,label:'State'}));
 assert.ok(rendered.includes(canonical.badgeVariants({variant:tone})),status);
 assert.equal((rendered.match(/bg-current/g)||[]).length,1,'exactly one StatusBadge dot');
 assert.ok(rendered.includes('Status: ') && rendered.includes('State'),'accessible prefix and label');
}
console.log('PASS: default dot/pill, native props/events, legacy tones/null/default, Tag neutrality/overrides and StatusBadge map/accessibility');

// @ts-expect-error Taxonomy does not accept status color props.
const tintedTag: TagProps = { color: 'red' };
void tintedTag;
// @ts-expect-error Taxonomy does not accept status tone variants.
const statusTag: TagProps = { variant: 'success' };
void statusTag;
