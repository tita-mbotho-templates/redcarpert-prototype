import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { bridalGalleryPhotos } from '../src/data/bridal-gallery.ts';
import { BRIDES_PATTERNS } from '../src/client/brides-gallery.js';
import { sitePages } from '../src/data/site.ts';
import { adaptEditorialDocument } from '../src/lib/editorial-pages.ts';
const descendants = list => list.flatMap(n => typeof n==='string' ? [] : [n,...descendants(n.children)]);
test('Our Brides has eighteen unique remote and credited stock images, no real-client claims',()=>{
  const ids=new Set(),images=new Set(),sources=new Set();
  const credits=readFileSync('docs/implementation-14-gallery-filter.md','utf8');
  assert.equal(bridalGalleryPhotos.length,18);
  for(const photo of bridalGalleryPhotos){
    assert.match(photo.id,/^inspiration-\d\d$/);
    assert.match(photo.image,/^https:\/\/images\.pexels\.com\/photos\/\d+\/pexels-photo-\d+\.jpeg\?/);
    assert.match(photo.sourceUrl,/^https:\/\/www\.pexels\.com\/photo\//);
    assert.match(photo.alt,/sample stock photography, not a Redcarpert customer/);
    assert(credits.includes(photo.sourceUrl),photo.sourceUrl+' credited');
    assert(credits.includes(photo.photographer),photo.photographer+' credited');
    ids.add(photo.id);images.add(photo.image);sources.add(photo.sourceUrl);
  }
  assert.equal(ids.size,18);assert.equal(images.size,18);assert.equal(sources.size,18);
});
test('five unique composed four-column layouts each contain eighteen photographs and six shades',()=>{
  assert.equal(BRIDES_PATTERNS.length,5);
  assert.equal(new Set(BRIDES_PATTERNS.map(x=>x.join(','))).size,5);
  for(const layout of BRIDES_PATTERNS){
    assert.equal(layout.length,6);assert.equal(new Set(layout).size,6);
    for(const slot of layout)assert(slot>=0&&slot<24);
    for(let row=0;row<6;row++)assert(layout.filter(slot=>Math.floor(slot/4)===row).length<=2,'at least two photos per row');
  }
});
test('Our Brides retains the site shell and renders all 18 preview buttons plus a native modal',()=>{
  const original=sitePages['/our-brides'];
  const adapted=adaptEditorialDocument(original);
  const inner=descendants(adapted.nodes);
  const container=inner.find(n=>n.attrs.id==='content-container');
  assert.equal(container.attrs.class,'content-boxed layout-full');
  assert.equal(inner.filter(n=>n.attrs.id==='sidebar').length,0,'remove unused sidebar for product-width page');
  assert.equal(inner.filter(n=>n.attrs.id==='full-width').length,1,'match catalogue full-width shell');
  assert(inner.some(n=>n.attrs.class==='content-box pexeto-woo-columns-4 redcarpert-brides-content-box'),'reuse product content box');
  const grid=inner.find(n=>n.attrs['data-brides-gallery']==='true');
  assert(grid);
  assert.equal(descendants(grid.children).filter(n=>n.attrs['data-bride-card']).length,18);
  assert.equal(descendants(grid.children).filter(n=>n.attrs['data-bride-preview']).length,18);
  assert.equal(descendants(grid.children).filter(n=>n.tag==='img').length,18);
  for(const image of descendants(grid.children).filter(n=>n.tag==='img')){
    assert.equal(image.attrs.width,'370');
    assert.equal(image.attrs.height,'370','Our Brides source frames are square');
  }
  const modal=inner.find(n=>n.tag==='dialog'&&n.attrs.id==='redcarpert-bride-preview');
  assert(modal);
  const dialogNodes=descendants(modal.children);
  assert.equal(dialogNodes.filter(n=>n.tag==='img').length,1,'modal has a single photo');
  assert.equal(dialogNodes.filter(n=>n.tag==='button'&&n.attrs['data-bride-preview-close']!==undefined).length,1,
    'modal has an accessible close control');
  assert.equal(dialogNodes.filter(n=>n.tag==='figcaption'||n.attrs.class==='redcarpert-bride-preview-details').length,0,
    'modal has no visible text panel');
  const intro=inner.find(n=>n.attrs.class==='redcarpert-brides-intro');
  const outro=inner.find(n=>n.attrs.class==='redcarpert-brides-disclosure');
  assert(intro&&outro,'both editorial text blocks explicitly centered');
  for(const element of inner.filter(n=>n.attrs.id==='header'||n.attrs.id==='footer')){
    assert(descendants(original.nodes).includes(element),'shell identity preserved');
  }
});
