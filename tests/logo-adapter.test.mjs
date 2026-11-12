import assert from 'node:assert/strict';
import test from 'node:test';
import { sitePages } from '../src/data/site.ts';
import { adaptLogo } from '../src/lib/logo-adapter.ts';
const freeze = value => { if(value && typeof value === 'object' && !Object.isFrozen(value)){Object.freeze(value);Object.values(value).forEach(freeze);}return value;};
test('all captured pages replace only logo attributes without mutating frozen sources',()=>{
  freeze(sitePages);
  for(const original of Object.values(sitePages)){
    const adapted=adaptLogo(original);let changed=0;
    const compare=(a,b)=>{
      if(typeof a==='string'){assert.equal(a,b);return;}
      assert.equal(a.tag,b.tag);assert.equal(a.children.length,b.children.length);
      if(a.tag==='img'&&a.attrs.src==='/site-assets/ce75cb7d04ef279275.png'){
        changed++;assert.deepEqual(b.attrs,{...a.attrs,src:'/redcarpert/brand/redcarpert-logo-optimized.webp',alt:'Redcarpert',style:'object-fit: contain'});
      }else assert.deepEqual(a.attrs,b.attrs);
      a.children.forEach((n,i)=>compare(n,b.children[i]));
      if(JSON.stringify(a)===JSON.stringify(b))assert.equal(a,b);
    };
    original.nodes.forEach((n,i)=>compare(n,adapted.nodes[i]));assert.equal(changed,1);
    for(const key of Object.keys(original).filter(k=>k!=='nodes'))assert.equal(original[key],adapted[key]);
  }
});
test('unexpected logo source or Home destination fails closed',()=>{
  for(const [from,to] of [['/site-assets/ce75cb7d04ef279275.png','/unexpected.png'],['"href":"/"','"href":"/unexpected"']]){
    const altered=JSON.parse(JSON.stringify(sitePages['/']).replace(from,to));
    assert.throws(()=>adaptLogo(altered),/incompatible captured header/);
  }
});
