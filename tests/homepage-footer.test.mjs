import assert from 'node:assert/strict';
import test from 'node:test';
import { sitePages } from '../src/data/site.ts';
import { addHomepageFooter } from '../src/lib/homepage-footer.ts';
import { adaptHomepageBackgrounds } from '../src/lib/homepage-backgrounds.ts';
import { adaptSiteDocument } from '../src/lib/content-adapter.ts';
import { contentAdaptations } from '../src/data/content-adaptations.ts';
const all = nodes => nodes.flatMap(n => typeof n === 'string' ? [] : [n, ...all(n.children)]);
const freeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); } return value; };
const source = sitePages['/about-us'];

test('three informational footers are identical; homepage receives one independent footer after unchanged page-wrapper', () => {
  freeze(sitePages);
  for (const route of ['/contact-us', '/our-brides']) assert.deepEqual(sitePages[route].nodes[1].children[3], source.nodes[1].children[3]);
  const home = adaptHomepageBackgrounds(adaptSiteDocument(sitePages['/'], contentAdaptations));
  const before = JSON.stringify(home);
  const output = addHomepageFooter(home, source);
  assert.equal(JSON.stringify(home), before);
  assert.equal(all(output.nodes).filter(n => n.tag === 'footer').length, 1);
  const main = output.nodes[1];
  assert.strictEqual(main.children[1], home.nodes[1].children[1]);
  assert.equal(main.children[2].tag, 'footer');
  assert.deepEqual(main.children.filter((_, i) => i !== 2), home.nodes[1].children);
  for (const key of Object.keys(home).filter(k => k !== 'nodes')) assert.strictEqual(output[key], home[key]);
  assert.equal(all(output.nodes).filter(n => n.attrs.class?.split(/\s+/).includes('section')).length, 3);
  const ids = all(output.nodes).map(n => n.attrs.id).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length);
  assert.notStrictEqual(main.children[2], source.nodes[1].children[3]);
});

test('copied footer preserves hierarchy and design except the authorised control removal and safe content changes', () => {
  const footer = addHomepageFooter(sitePages['/'], source).nodes[1].children[2];
  const canonical = source.nodes[1].children[3];
  assert.equal(all([canonical]).filter(n => n.attrs.class === 'scroll-to-top').length, 1);
  assert.equal(all([footer]).filter(n => n.attrs.class === 'scroll-to-top').length, 0);
  const expected = { ...canonical, children: canonical.children.filter(n => typeof n === 'string' || n.attrs.class !== 'scroll-to-top') };
  const nodes = all([footer]), original = all([expected]);
  assert.equal(nodes.length, original.length);
  nodes.forEach((node, i) => { assert.equal(node.tag, original[i].tag); assert.equal(node.attrs.class, original[i].attrs.class); assert.equal(node.attrs.style, original[i].attrs.style); assert.equal(node.attrs.id, original[i].attrs.id); });
  const serialized = JSON.stringify(footer);
  assert.ok(!/Br[ıi]dal.?Vanesa|bridalvanesa|bridal_vanesa|vanesabridal|TATLI|gmail|\+90|Vienna|Denizli/i.test(serialized));
  assert.match(serialized, /Redcarpert Wedding Dresses/);
  assert.match(serialized, /Contact details to be confirmed/);
  for (const a of nodes.filter(n => n.tag === 'a')) { assert.equal(a.attrs.href, undefined); assert.equal(a.attrs.target, undefined); assert.equal(a.attrs['aria-disabled'], 'true'); }
  const images = nodes.filter(n => n.tag === 'img');
  assert.deepEqual(images.slice(1), original.filter(n => n.tag === 'img').slice(1));
  assert.equal(images[0].attrs.width, '1024'); assert.equal(images[0].attrs.height, '322');
  assert.ok(images[0].attrs.src.startsWith('data:image/svg+xml,'));
  assert.equal(images[0].attrs.srcset, undefined);
});

test('all other 7 routes remain the same objects; canonical source is never mutated', () => {
  const before = JSON.stringify(source);
  assert.equal(Object.keys(sitePages).length, 8);
  for (const [route, document] of Object.entries(sitePages)) if (route !== '/') assert.strictEqual(addHomepageFooter(document, source), document);
  addHomepageFooter(sitePages['/'], source);
  assert.equal(JSON.stringify(source), before);
});

test('unexpected source, content, duplicate IDs, duplicate footer or section count fail closed', () => {
  const invalidSource = structuredClone(source);
  all(invalidSource.nodes).find(n => n.attrs.id === 'block-20').children[1].children = ['Unexpected'];
  assert.throws(() => addHomepageFooter(sitePages['/'], invalidSource), /Homepage footer/);
  assert.throws(() => addHomepageFooter(sitePages['/'], sitePages['/contact-us']), /Homepage footer/);
  const duplicate = addHomepageFooter(sitePages['/'], source);
  assert.throws(() => addHomepageFooter(duplicate, source), /Homepage footer/);
  const id = structuredClone(sitePages['/']); id.nodes.push({tag:'div',attrs:{id:'block-9'},children:[]});
  assert.throws(() => addHomepageFooter(id, source), /Homepage footer/);
  const sections = structuredClone(sitePages['/']); all(sections.nodes).find(n => n.attrs.class === 'section section-text layout-cc').attrs.class = 'changed';
  assert.throws(() => addHomepageFooter(sections, source), /Homepage footer/);
});
