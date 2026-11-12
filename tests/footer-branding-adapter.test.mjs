import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {PNG} from 'pngjs';
import {sitePages} from '../src/data/site.ts';
import {adaptFooterSocials} from '../src/lib/footer-social-adapter.ts';
import {addHomepageFooter} from '../src/lib/homepage-footer.ts';
import {correctFooterLinks} from '../src/lib/footer-link-corrections.ts';
import {adaptFooterBranding} from '../src/lib/footer-branding-adapter.ts';
const all=nodes=>nodes.flatMap(n=>typeof n==='string'?[]:[n,...all(n.children)]);
const footer=d=>all(d.nodes).find(n=>n.tag==='footer');
const prepare=d=>correctFooterLinks(addHomepageFooter(adaptFooterSocials(d),sitePages['/about-us']));
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const text=n=>n.children.map(c=>typeof c==='string'?c:text(c)).join('');

test('all 8 routes receive the guarded three-column design with functional categories and fitting hook',()=>{
 assert.equal(Object.keys(sitePages).length,8);
 let common;
 for(const source of Object.values(sitePages)){
  const input=freeze(prepare(source)),before=JSON.stringify(input),output=adaptFooterBranding(input);
  const f=footer(output),nodes=all([f]),old=all([footer(input)]);
  assert.equal(f.attrs['data-redcarpert-footer'],'true');
  const widgets=nodes.find(n=>n.attrs.class==='cols-wrapper footer-widgets section-boxed redcarpert-footer-columns');
  const columns=widgets.children.filter(n=>typeof n!=='string');assert.equal(columns.length,3);
  assert(!nodes.some(n=>/\bcols-[34]\b/.test(n.attrs.class??'')));
  assert.deepEqual(columns.map(text).map(t=>t.trim()),['Elegant bridal collections','COLLECTIONS\n\nMermaidBall Gown','FITTINGS\n\nBook a fitting']);
  assert(!nodes.some(n=>n.attrs.id==='block-13'));
  assert.deepEqual(nodes.filter(n=>n.tag==='h2').map(n=>({attrs:n.attrs,text:text(n)})),[
   {attrs:{class:'redcarpert-footer-heading'},text:'COLLECTIONS'},
   {attrs:{class:'redcarpert-footer-heading'},text:'FITTINGS'},
  ]);
  const links=nodes.filter(n=>n.tag==='a'&&n.attrs.href);
  assert.deepEqual(links.map(n=>[text(n),n.attrs.href]),[['Mermaid','/product-category/mermaid/'],['Ball Gown','/product-category/ball_gown/']]);
  for(const link of links)assert(sitePages[link.attrs.href.replace(/\/$/,'')]);
  const fitting=nodes.filter(n=>n.tag==='button');assert.equal(fitting.length,1);
  assert.deepEqual(fitting[0],{tag:'button',attrs:{type:'button',class:'redcarpert-footer-book','data-whatsapp-preview':'','aria-haspopup':'dialog','aria-label':'Book a fitting via WhatsApp'},children:[
    {tag:'i',attrs:{class:'fa-brands fa-whatsapp','aria-hidden':'true'},children:[]},
    {tag:'span',attrs:{},children:['Book a fitting']},
  ]});
  assert.deepEqual(nodes.find(n=>n.attrs.class==='copyrights').children,[
    '© ',
    {tag:'span',attrs:{'data-copyright-year':''},children:[String(new Date().getFullYear())]},
    ' Redcarpert Wedding Dresses',
  ]);
  const logo=nodes.find(n=>n.attrs.class==='wp-image-13926');
  assert.deepEqual(logo.attrs,{loading:'lazy',decoding:'async',width:'1024',height:'322',src:'/redcarpert/brand/redcarpert-logo-optimized.webp',alt:'Redcarpert Wedding Dresses',class:'wp-image-13926',style:'object-fit: contain; object-position: center'});
  const profiles=nodes.filter(n=>n.attrs.class==='social-profiles');assert.equal(profiles.length,1);
  const brand=nodes.find(n=>n.attrs.id==='block-9');assert.equal(brand.children.at(-1),profiles[0]);
  assert.equal(brand.children.at(-2).children[0],'Elegant bridal collections');
  assert(!all([nodes.find(n=>n.attrs.class==='footer-bottom')]).includes(profiles[0]));
  assert.equal(nodes.filter(n=>n.attrs.class==='social-icons').length,1);
  assert.deepEqual(all([profiles[0]]).filter(n=>n.tag==='img').map(n=>n.attrs.src),['https://nirvanatakipcim.com/gelinlik/wp-content/themes/thestory/images/icons_white/instagram.png','/site-assets/3d94819dd14ede1760.png','/site-assets/4600dc5b99e2f02b67.png','/site-assets/3b9a6e23cf5c478efd.png','/site-assets/54721da2e3bb14d829.png']);
  // Approved social subtrees, local icons, scroll control and all non-footer nodes stay shared.
  for(const n of old.filter(n=>n.attrs.class==='social-profiles'||n.attrs.class==='scroll-to-top'||n.tag==='a'||n.tag==='img'&&n.attrs.class!=='wp-image-13926'))assert(nodes.includes(n));
  const compareOutside=(a,b)=>{if(typeof a==='string')return assert.equal(a,b);if(a.tag==='footer')return;if(!all([a]).some(n=>n.tag==='footer'))return assert.equal(a,b);assert.deepEqual(a.attrs,b.attrs);a.children.forEach((c,i)=>compareOutside(c,b.children[i]));};
  input.nodes.forEach((n,i)=>compareOutside(n,output.nodes[i]));
  for(const key of Object.keys(input).filter(k=>k!=='nodes'))assert.equal(input[key],output[key]);
  assert.equal(JSON.stringify(input),before);
  assert(!/Vanesa|TATLI|Vienna|Denizli|gmail|\+90|prototype|Demonstration|to be confirmed|Bridal Catalogue/i.test(text(f)));
  // Prior homepage/canonical social labels intentionally differ; each subtree is retained verbatim above.
  const branding=structuredClone(widgets);
  all([branding]).find(n=>n.attrs.class==='social-profiles').children=[];
  if(common)assert.deepEqual(branding,common);else common=branding;
 }
});
test('missing, duplicate, relocated, malformed and already-branded targets reject with route context',()=>{
 for(const route of ['/','/about-us']){
  const mutations=[
   d=>{d.nodes=[];},
   d=>{const profile=all([footer(d)]).find(n=>n.attrs.class==='social-profiles');footer(d).children.push(structuredClone(profile));},
   d=>{all([footer(d)]).find(n=>n.attrs.class==='social-profiles').attrs.class='changed';},
   d=>{all([all([footer(d)]).find(n=>n.attrs.class==='social-profiles')]).find(n=>n.tag==='a').attrs.href='https://example.com';},
   d=>{d.nodes.push(structuredClone(footer(d)));},
   d=>{all(d.nodes).find(n=>n.attrs.id==='block-20').attrs.id='wrong';},
   d=>{all(d.nodes).find(n=>n.attrs.id==='block-24').children[1].children=['unexpected'];},
   d=>{all(d.nodes).find(n=>n.tag==='sub').children=['unexpected'];},
   d=>{all(d.nodes).find(n=>n.attrs.class==='wp-image-13926').attrs.src='/other.png';},
   d=>{all(d.nodes).find(n=>n.attrs.class==='wp-image-13926').attrs.width='100';},
   d=>{const columns=all(d.nodes).filter(n=>n.attrs.class==='col');[columns[1].children,columns[2].children]=[columns[2].children,columns[1].children];},
  ];
  for(const mutate of mutations){const d=structuredClone(prepare(sitePages[route]));mutate(d);assert.throws(()=>adaptFooterBranding(d),/Footer branding .*: incompatible footer/);}
  assert.throws(()=>adaptFooterBranding(adaptFooterBranding(prepare(sitePages[route]))),/Footer branding/);
 }
});
test('approved artwork source stays identical while the generated logo URL is optimised',()=>{
 const bytes=readFileSync(new URL('../public/redcarpert/brand/redcarpert-logo.png',import.meta.url));
 const png=PNG.sync.read(bytes);assert.equal(png.width,2208);assert.equal(png.height,813);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'b275618991b94ccebd6c9b6100ec455dfe1984e9ee7081a96f7a0d000ba208d2');
 for(const source of Object.values(sitePages)){
  const logo=all([footer(adaptFooterBranding(prepare(source)))]).find(n=>n.attrs.class==='wp-image-13926');
  assert.equal(logo.attrs.src,'/redcarpert/brand/redcarpert-logo-optimized.webp');assert.equal(logo.attrs.srcset,undefined);assert.equal(logo.attrs.sizes,undefined);
  assert.match(logo.attrs.style,/object-fit: contain/);assert(!/clip|cover|overflow|transform/.test(logo.attrs.style));
 }
});
