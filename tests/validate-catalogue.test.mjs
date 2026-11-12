import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogueProducts } from '../src/data/catalogue.ts';
import { validateCatalogue } from '../src/lib/validate-catalogue.ts';
const sample = () => structuredClone(catalogueProducts);
test('eight credited Pexels samples validate without mutation', () => {
 const products=sample(), original=JSON.stringify(products);
 assert.doesNotThrow(()=>validateCatalogue(products));
 assert.equal(JSON.stringify(products),original);
 assert.equal(products.filter(p=>p.category==='mermaid').length,4);
 assert.equal(products.filter(p=>p.category==='ball_gown').length,4);
});
test('duplicate IDs and routes fail before generation', () => {
 const samples=sample();
 assert.throws(()=>validateCatalogue(samples.map((p,i)=>i===1?{...p,id:samples[0].id}:p)),/Duplicate or invalid product ID/);
 assert.throws(()=>validateCatalogue(samples.map((p,i)=>i===1?{...p,previewRoute:samples[0].previewRoute}:p)),/Duplicate or invalid preview route/);
 assert.throws(()=>validateCatalogue(samples.slice(0,7)),/eight approved samples/);
});
test('reject unapproved hosts, paths, missing attribution, categories and inventory claims',()=>{
 const samples=sample();
 for(const [change,message] of [
  [{status:'confirmed'},/Unverified inventory/],
  [{detailReference:'/product/real'},/Unverified inventory/],
  [{image:'https://example.com/bad.jpg'},/Unapproved or duplicate Pexels image/],
  [{image:'https://images.pexels.com.evil.com/photos/1/pexels-photo-1.jpeg'},/Unapproved or duplicate Pexels image/],
  [{image:'/redcarpert/../bad.webp'},/Unapproved or duplicate Pexels image/],
  [{image:samples[1].image},/Unapproved or duplicate Pexels image|Missing image provenance/],
  [{category:'other'},/Unapproved category/],
  [{name:''},/Missing sample disclosure/],
  [{imageAlt:'missing'},/Missing sample disclosure/],
  [{imageCredit:{...samples[0].imageCredit,sourceUrl:'https://example.com'}},/Missing image provenance/],
 ]) assert.throws(()=>validateCatalogue(samples.map((p,i)=>i===0?{...p,...change}:p)),message);
});
