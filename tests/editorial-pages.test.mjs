import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import { sitePages } from '../src/data/site.ts';
import { adaptEditorialDocument } from '../src/lib/editorial-pages.ts';
import { createSampleLookbookPdf } from '../src/lib/lookbook-pdf.ts';

const nodes = list => list.flatMap(n => typeof n === 'string' ? [] : [n, ...nodes(n.children)]);
test('new Redcarpert editorial content reuses source shell and never exposes original business copy', () => {
  for (const route of ['/about-us', '/contact-us', '/wedding-moments', '/digital-lookbook']) {
    const capture = sitePages[route === '/digital-lookbook' ? '/about-us' : route];
    const source = { ...capture, route };
    const before = JSON.stringify(capture);
    const actual = adaptEditorialDocument(source);
    const sourceNodes = nodes(capture.nodes), rendered = nodes(actual.nodes);
    for (const id of ['header', 'footer']) {
      const old = sourceNodes.find(n => n.attrs.id === id);
      assert.strictEqual(rendered.find(n => n.attrs.id === id), old, id + ' preserved in ' + route);
    }
    const content = rendered.find(n => n.attrs['data-editorial-route'] === route);
    assert(content, 'missing editorial content for ' + route);
    assert(!/BRIDAL VANESA|bridalvanesa|Vienna|Denizli|1980/.test(JSON.stringify(content)));
    if (route === '/wedding-moments') {
      assert.equal(nodes(content.children).filter(n => n.tag === 'h2').length, 0,
        'minimal Wedding Moments has no category headings');
    } else {
      assert.equal(nodes(content.children).filter(n => n.tag === 'h2').length > 0, true);
    }
    if (route === '/digital-lookbook') {
      assert.equal(nodes(content.children).filter(n => n.attrs['data-lookbook-viewer'] === 'true').length, 1);
      assert(nodes(content.children).some(n => n.attrs.id === 'redcarpert-lookbook-title'));
    }
    if (route === '/about-us' || route === '/contact-us' || route === '/digital-lookbook') {
      assert(rendered.some(n => n.attrs.class === 'page-title redcarpert-editorial-page-title'));
      assert(nodes(content.children).some(n => n.attrs.class === 'redcarpert-editorial-hero'));
    }
    if (route === '/about-us') {
      const team=nodes(content.children).filter(n => n.attrs.class === 'redcarpert-editorial-team-card');
      assert.equal(team.length,3,'Meet the Team requires three placeholder cards');
      for(const card of team){
        const image=nodes(card.children).find(n=>n.tag==='img');
        assert(image.attrs.src.startsWith('https://images.pexels.com/photos/'), 'team photographs must remain remote placeholders');
        assert.match(JSON.stringify(card),/Not Redcarpert staff/);
      }
    }
    if (route === '/contact-us') {
      const container=rendered.find(n=>n.attrs.id==='content-container');
      assert.equal(container.attrs.class,'content-boxed layout-full');
      assert(!rendered.some(n=>n.attrs.id==='sidebar'),'empty sidebar must be removed from Contact Us');
      assert(rendered.some(n=>n.attrs.id==='full-width'),'Contact Us must use About Us content width');
      const map=nodes(content.children).find(n=>n.tag==='iframe');
      assert(map,'Contact Us must include an embedded map');
      assert.equal(map.attrs.src,'https://www.google.com/maps?q=Sunnyside%2C%20Pretoria%2C%20South%20Africa&output=embed');
      assert.equal(map.attrs.loading,'lazy');
      assert.match(JSON.stringify(content),/not a precise studio pin/);
      const mapLink=nodes(content.children).find(n=>n.tag==='a' && n.attrs.href?.startsWith('https://www.google.com/maps/search/'));
      assert(mapLink);
      assert.equal(mapLink.attrs.rel,'noopener noreferrer');
    }
    assert.equal(JSON.stringify(capture), before);
  }
});

test('lookbook PDF is a two-page illustrated PDF with correct xref and no client claims', async () => {
  const jpeg = await sharp({create:{width:24,height:36,channels:3,background:'#dddddd'}}).jpeg().toBuffer();
  const pdf = createSampleLookbookPdf([
    { jpeg, width: 24, height: 36, category: 'Mermaid', sample: 'Sample 01', photographer: 'Stock' },
    { jpeg, width: 24, height: 36, category: 'Ball Gown', sample: 'Sample 02', photographer: 'Stock' },
  ]);
  assert.equal(pdf.toString('latin1',0,8),'%PDF-1.4');
  const text = pdf.toString('latin1');
  assert.match(text,/\/Count 2/);
  assert.match(text,/DIGITAL LOOKBOOK/);
  assert.match(text,/not confirmed Redcarpert inventory/);
  assert.match(text,/\/DCTDecode/);
  assert.match(text,/startxref\n\d+\n%%EOF/);
});
