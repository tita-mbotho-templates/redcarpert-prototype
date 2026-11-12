import test from 'node:test';
import assert from 'node:assert/strict';
import { WHATSAPP_NUMBER, WHATSAPP_DISPLAY_NUMBER, buildWhatsAppUrl } from '../src/config/whatsapp.ts';
import { catalogueProducts } from '../src/data/catalogue.ts';
import { sampleFittingMessage } from '../src/lib/product-detail-preview.ts';

test('client-authorized South African WhatsApp number is formatted correctly',()=>{
  assert.equal(WHATSAPP_NUMBER,'27680458811');
  assert.equal(WHATSAPP_DISPLAY_NUMBER,'+27 68 045 8811');
});

test('live WhatsApp link encodes the full multiline message and does not automatically send',()=>{
  const message='Hello Redcarpert Wedding Dresses!\n\nI would like a fitting for a Mermaid dress & a veil.';
  const url=new URL(buildWhatsAppUrl(message));
  assert.equal(url.protocol,'https:');
  assert.equal(url.hostname,'wa.me');
  assert.equal(url.pathname,'/27680458811');
  assert.deepEqual([...url.searchParams.keys()],['text']);
  assert.equal(url.searchParams.get('text'),message);
  assert.throws(()=>buildWhatsAppUrl('   '),/empty WhatsApp message/);
});

test('all eight dress-detail WhatsApp messages keep the selected sample and its category',()=>{
  assert.equal(catalogueProducts.length,8);
  for(const dress of catalogueProducts){
    const url=new URL(buildWhatsAppUrl(sampleFittingMessage(dress)));
    const message=url.searchParams.get('text');
    assert(message.includes(dress.name),dress.name+' missing');
    assert(message.includes(dress.category==='mermaid'?'Mermaid':'Ball Gown'),dress.name+' category missing');
    assert(message.includes('not confirmed Redcarpert inventory'),dress.name+' missing demo disclosure');
  }
});
