import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {sitePages} from '../src/data/site.ts';
import {catalogueProducts,catalogueCategories} from '../src/data/catalogue.ts';
import {adaptCatalogue} from '../src/lib/catalogue-adapter.ts';
const all=n=>n.flatMap(x=>typeof x==='string'?[]:[x,...all(x.children)]);
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const listingRoutes=['/product','/product-category/mermaid','/product-category/ball_gown'];
test('eight shared sample records have remote Pexels photographs and no invented inventory/detail destinations',()=>{
 assert.deepEqual(catalogueCategories.map(c=>c.name),['Mermaid','Ball Gown']);assert.equal(catalogueProducts.length,8);assert.equal(catalogueProducts.filter(p=>p.category==='mermaid').length,4);assert.equal(catalogueProducts.filter(p=>p.category==='ball_gown').length,4);
 for(const p of catalogueProducts){assert.equal(p.status,'sample');assert.equal(p.detailReference,null);assert.match(p.name,/^Sample /);assert.match(p.imageAlt,/not Redcarpert inventory/);assert.match(p.image,/^https:\/\/images\.pexels\.com\/photos\//);const report=readFileSync(p.imageCredit.provenance,'utf8');assert(report.includes(p.imageCredit.sourceUrl));assert(report.includes(p.imageCredit.photographer));assert(!('price'in p));assert(!('sizes'in p));}
});
test('only the three approved listing documents change; other routes and all protected subtrees retain identity',()=>{
 freeze(sitePages);const before=JSON.stringify(sitePages);
 for(const input of Object.values(sitePages)){
  const output=adaptCatalogue(input,catalogueProducts);
  if(!listingRoutes.includes(input.route)){assert.equal(output,input);continue;}
  for(const key of Object.keys(input).filter(k=>k!=='nodes'))assert.equal(input[key],output[key]);
  for(const n of all(input.nodes).filter(n=>n.attrs.id==='header'||n.tag==='footer'||n.attrs.id==='ht-ctc-chat'))assert(all(output.nodes).includes(n));
  const nodes=all(output.nodes),grid=nodes.find(n=>n.attrs['data-catalogue-preview']);assert.equal(grid.attrs.class,'products columns-4');
  const items=grid.children.filter(n=>typeof n!=='string');assert.equal(items.length,input.route==='/product'?8:4);
  for(const card of items){const p=catalogueProducts.find(p=>p.id===card.attrs['data-catalogue-id']);assert(p);if(input.route!=='/product')assert(input.route.endsWith('/'+p.category));const n=all([card]);const img=n.find(n=>n.tag==='img');assert.equal(img.attrs.src,p.image);assert.equal(img.attrs.width,'370');assert.equal(img.attrs.height,'370');assert.equal(card.attrs['data-catalogue-category'],p.category);assert.equal(img.attrs.srcset,undefined);assert.match(img.attrs.style,/aspect-ratio: 1 \/ 1/);assert.equal(n.find(n=>n.tag==='a').attrs.href,p.previewRoute);assert.equal(n.find(n=>n.tag==='a').attrs['aria-disabled'],undefined);assert.equal(sitePages[p.previewRoute],undefined);assert.equal(n.find(n=>n.tag==='h2').children[0],p.name);assert.equal(n.find(n=>n.attrs.class==='catalogue-sample-note').children[0],'Sample imagery');assert(!n.some(n=>n.attrs.class==='price'||n.attrs.class?.includes('add_to_cart')));}
  assert(!nodes.some(n=>n.attrs.class==='woocommerce-pagination'));const order=nodes.find(n=>(n.attrs.class||'').split(' ').includes('woocommerce-ordering'));assert.equal(order.tag,'div');assert(!all([order]).some(n=>n.tag==='form'||n.attrs.name==='orderby'||n.attrs.value==='price'));if(input.route==='/product'){const buttons=all([order]).filter(n=>n.tag==='button'&&n.attrs['data-filter-category']);assert.deepEqual(buttons.map(n=>n.attrs['data-filter-category']),['all','mermaid','ball_gown']);assert.equal(buttons.filter(n=>n.attrs['aria-pressed']==='true').length,1);}else{assert.equal(order.attrs['aria-hidden'],'true');}
 }
 assert.equal(JSON.stringify(sitePages),before);
});
test('unexpected structures/counts, commerce slots and unready data fail closed',()=>{
 for(const route of listingRoutes){for(const mutate of [
  d=>{all(d.nodes).find(n=>n.attrs.class==='products columns-4').children=[];},
  d=>{all(d.nodes).find(n=>n.attrs.class==='price').children=['€1,000'];},
  d=>{all(d.nodes).find(n=>n.attrs.class==='orderby').children=[];},
  d=>{all(d.nodes).find(n=>n.attrs.class==='woocommerce-LoopProduct-link woocommerce-loop-product__link').attrs.href='/unknown';},
 ]){const d=structuredClone(sitePages[route]);mutate(d);assert.throws(()=>adaptCatalogue(d,catalogueProducts),/Catalogue .*incompatible capture/);}
 assert.throws(()=>adaptCatalogue(adaptCatalogue(sitePages[route],catalogueProducts),catalogueProducts),/Catalogue/);
 assert.throws(()=>adaptCatalogue(sitePages[route],catalogueProducts.map(p=>({...p,detailReference:'/unready'}))),/sample readiness/);
 }
});
