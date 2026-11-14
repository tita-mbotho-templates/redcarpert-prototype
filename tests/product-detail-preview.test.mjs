import assert from 'node:assert/strict';
import test from 'node:test';
import {sitePages} from '../src/data/site.ts';
import {catalogueProducts} from '../src/data/catalogue.ts';
import {createProductDetailPreview,sampleDetailTitle,sampleFittingMessage,sampleGalleryImages} from '../src/lib/product-detail-preview.ts';
import { displayDressPrice } from '../src/lib/pricing.ts';
const all=nodes=>nodes.flatMap(n=>typeof n==='string'?[]:[n,...all(n.children)]);
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
test('previews are isolated, immutable, collision-free and contain one genuine sample slide with no commerce or inherited dress claims',()=>{
 freeze(sitePages);freeze(catalogueProducts);const before=JSON.stringify(sitePages);
 const routes=new Set();
 for(const product of catalogueProducts){
  const source=sitePages['/product/arabella'];const output=createProductDetailPreview(source,product);const nodes=all(output.nodes);
  assert.equal(output.route,product.previewRoute);assert.equal(sitePages[output.route],undefined);assert(!routes.has(output.route));routes.add(output.route);
  assert.equal(product.detailReference,null);assert(output.title.includes('Sample Preview'));
  for(const n of all(source.nodes).filter(n=>['header','footer','ht-ctc-chat'].includes(n.attrs.id)))assert(nodes.includes(n));
  assert.equal(output.styles,source.styles);assert.equal(output.scripts,source.scripts);assert.equal(output.themeConfig,source.themeConfig);
  const root=nodes.find(n=>n.attrs['data-detail-preview']);const content=all([root]);
  const gallery=sampleGalleryImages[product.id];
  assert.equal(content.filter(n=>n.tag==='img').length,1);assert.equal(content.find(n=>n.tag==='img').attrs.src,gallery.src);
  assert.equal(content.find(n=>n.attrs['data-fancybox']).attrs.href,gallery.src);
  assert.equal(content.find(n=>n.tag==='img').attrs.width,String(gallery.width));assert.equal(content.find(n=>n.tag==='img').attrs.height,String(gallery.height));
  assert(!nodes.some(n=>n.attrs.class==='social-share'||n.attrs.class?.includes('share-item')));
  assert.equal(all(source.nodes).filter(n=>n.attrs.class==='social-share').length,1);
  assert.equal(content.find(n=>n.tag==='h1').children[0],product.name);
  const card=content.find(n=>n.attrs.class==='redcarpert-detail-card');
  assert(card,'detail information must be inside a floating card');
  assert.equal(content.filter(n=>n.attrs.class==='redcarpert-detail-collection').length,1);
  assert.equal(content.find(n=>n.attrs.class==='redcarpert-detail-collection').children[0],
    (product.category==='mermaid'?'Mermaid':'Ball Gown')+' Collection');
  assert.equal(content.find(n=>Object.hasOwn(n.attrs,'data-dress-price')).children[0],
    displayDressPrice(product.priceZar));
  assert(!all([card]).some(n=>n.attrs.class==='sample-detail-notice'),
    'stock image disclosure must sit outside the floating card');
  assert(content.some(n=>n.attrs.class==='sample-detail-notice'));
  assert(content.some(n=>n.attrs.class==='redcarpert-detail-actions'),
    'fitting action is inside card');
  assert(content.some(n=>n.tag==='button'&&n.children[0]==='Book a Fitting'&&Object.hasOwn(n.attrs,'data-whatsapp-preview')));
  assert(!content.some(n=>n.attrs.class==='product_meta'),'collection should never repeat');
  assert(!content.some(n=>['form','input','select','textarea'].includes(n.tag)));
  assert(!content.some(n=>/\b(stock|instock|cart|quantity|related|reviews_tab)\b/.test(n.attrs.class||'')));
  assert(!content.some(n=>n.attrs.class==='tabs wc-tabs'),'remove inherited sample description tabs');
  assert(!content.some(n=>n.attrs.id==='wpgis-gallery'));
  const text=JSON.stringify(root);assert(!/Arabella|Worldwide Shipping|French|satin|checkout|payment|woocommerce_loop_add_to_cart/i.test(text));
  assert(text.includes('not confirmed Redcarpert inventory'));
  assert(!content.some(n=>n.attrs.href?.startsWith('/product/')&&!n.attrs.href.startsWith('/product/preview/')));
  const message=sampleFittingMessage(product);assert(message.includes(sampleDetailTitle(product)));assert(message.includes('not confirmed Redcarpert inventory'));assert(!/wa\.me|whatsapp\.com|\+\d/.test(message));
 }
 assert.equal(JSON.stringify(sitePages),before);
});
test('unexpected source structures, commerce content and unverified mappings fail closed',()=>{
 const product=catalogueProducts[0];
 for(const mutate of [
  d=>{d.route='/product/aventhera';},
  d=>{all(d.nodes).find(n=>n.attrs.id==='product-15828').children=[];},
  d=>{all(d.nodes).find(n=>n.attrs.class==='price').children=['£999'];},
  d=>{all(d.nodes).find(n=>n.attrs.class==='slider wpgis-slider-for').children=[];},
  d=>{all(d.nodes).find(n=>n.attrs.id==='tab-description').attrs.id='unexpected';},
  d=>{all(d.nodes).find(n=>n.attrs.class==='social-share').attrs.class='unexpected';},
  d=>{all(d.nodes).find(n=>n.attrs.class==='share-item share-fb').attrs['data-url']='https://example.com/';},
 ]){const source=structuredClone(sitePages['/product/arabella']);mutate(source);assert.throws(()=>createProductDetailPreview(source,product),/incompatible/);}
 for(const changes of [{previewRoute:'/product/arabella'},{detailReference:'/product/client'},{id:'invented'},{status:'confirmed'},{category:'ball_gown'},{image:'https://example.com/photo.jpg'}])assert.throws(()=>createProductDetailPreview(sitePages['/product/arabella'],{...product,...changes}),/incompatible sample mapping/);
});
test('each detail reuses the corresponding remote Pexels image without local downloads',()=>{
 assert.equal(catalogueProducts.length,8);
 for(const product of catalogueProducts){
  const gallery=sampleGalleryImages[product.id];
  assert.equal(gallery.src,product.image);
  assert.equal(gallery.width,1200);
  assert.equal(gallery.height,1800);
  assert.match(gallery.src,/^https:\/\/images\.pexels\.com\/photos\//);
 }
});
