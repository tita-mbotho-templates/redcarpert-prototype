import assert from 'node:assert/strict';
import test from 'node:test';
import {sitePages} from '../src/data/site.ts';
import {adaptHomepageCollectionYears} from '../src/lib/homepage-collection-years.ts';

const heading = d => d.nodes[1].children[1].children[4].children[1].children[1].children[0].children[0].children[0];
const renderedText = n => n.children.map(c => typeof c === 'string' ? c : renderedText(c)).join('');

test('homepage collection heading uses current and next year without altering approved presentation', () => {
  const original=sitePages['/'];
  const snapshot=JSON.stringify(original);
  const old=heading(original);
  for(const year of [2026,2027,2028,2035]){
    const output=adaptHomepageCollectionYears(original,year);
    const next=heading(output);
    assert.equal(renderedText(next),`${year} - ${year+1} Collectıon`);
    assert.deepEqual(next.attrs,old.attrs);
    assert.equal(next.tag,'h2');
    const yearSpans=next.children.filter(n=>typeof n!=='string');
    assert.deepEqual(yearSpans.map(n=>n.attrs['data-collection-year']),['start','end']);
    assert.deepEqual(yearSpans.map(n=>n.children),[[String(year)],[String(year+1)]]);
    assert.strictEqual(output.nodes[0],original.nodes[0],'unrelated nodes must retain identity');
    assert.equal(JSON.stringify(original),snapshot,'captured content must not change');
  }
});

test('collection years are homepage-only and mismatched captured content fails closed',()=>{
  for(const [route,doc] of Object.entries(sitePages)){
    if(route==='/')continue;
    assert.strictEqual(adaptHomepageCollectionYears(doc,2027),doc,route);
  }
  const altered=structuredClone(sitePages['/']);
  heading(altered).children=['A different heading'];
  const snapshot=JSON.stringify(altered);
  assert.throws(()=>adaptHomepageCollectionYears(altered,2027),/Homepage collection heading/);
  assert.equal(JSON.stringify(altered),snapshot,'failure should not mutate source');
});
