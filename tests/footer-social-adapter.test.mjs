import assert from 'node:assert/strict';
import test from 'node:test';
import { sitePages } from '../src/data/site.ts';
import { adaptFooterSocials } from '../src/lib/footer-social-adapter.ts';
import { addHomepageFooter } from '../src/lib/homepage-footer.ts';
const all=nodes=>nodes.flatMap(node=>typeof node==='string'?[]:[node,...all(node.children)]);
const footer=d=>all(d.nodes).find(n=>n.attrs.id==='footer');
const links=d=>all([footer(d)]).filter(n=>n.tag==='a');
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);Object.values(value).forEach(freeze);}return value;};
const platforms=['Instagram','YouTube','Twitter','Pinterest','TikTok'];

test('all 7 canonical footers map five exact platforms to accessible disabled anchors',()=>{
  for(const original of Object.values(sitePages).filter(d=>d.route!=='/')){
    const d=adaptFooterSocials(original);
    assert.equal(links(d).length,5);
    links(d).forEach((link,i)=>{
      assert.deepEqual(link.attrs,{style:'cursor: pointer',role:'link','aria-disabled':'true','aria-label':`${platforms[i]}: destination not yet available`});
      assert.equal(link.children,links(original)[i].children);
      assert.deepEqual(all(link.children),all(links(original)[i].children));
    });
  }
});
test('frozen captures remain immutable; only five anchors and their ancestors change identity',()=>{
  freeze(sitePages);const before=JSON.stringify(sitePages);
  for(const original of Object.values(sitePages)){
    const d=adaptFooterSocials(original);const changed=original.route==='/'?[]:links(original);
    const compare=(a,b)=>{
      if(typeof a==='string'){assert.equal(a,b);return;}
      assert.equal(a.tag,b.tag);assert.equal(a.children.length,b.children.length);
      if(!changed.includes(a))assert.deepEqual(a.attrs,b.attrs);
      if(!all([a]).some(n=>changed.includes(n)))assert.equal(a,b);
      a.children.forEach((n,i)=>compare(n,b.children[i]));
    };
    original.nodes.forEach((n,i)=>compare(n,d.nodes[i]));
    for(const key of Object.keys(original).filter(k=>k!=='nodes'))assert.equal(d[key],original[key]);
  }
  assert.equal(JSON.stringify(sitePages),before);
});
test('homepage passes through before existing helper and receives its unchanged safe footer',()=>{
  const home=sitePages['/'];assert.equal(adaptFooterSocials(home),home);
  const d=addHomepageFooter(adaptFooterSocials(home),sitePages['/about-us']);
  assert.deepEqual(d,addHomepageFooter(home,sitePages['/about-us']));
  links(d).forEach((link,i)=>{assert.equal(link.attrs.href,undefined);assert.equal(link.attrs['aria-label'],`${platforms[i]}: destination to be confirmed`);});
  assert.throws(()=>adaptFooterSocials(d),/homepage must precede footer insertion/);
});
test('unrelated body, header and footer links remain shared',()=>{
  const d=structuredClone(sitePages['/contact-us']);const extra={tag:'a',attrs:{href:'https://example.com/',target:'_blank',title:'Keep'},children:['Unrelated']};
  footer(d).children.push(extra);const output=adaptFooterSocials(d);
  assert.ok(all(output.nodes).includes(extra));
  const oldLinks=all(d.nodes).filter(n=>n.tag==='a'&&!links(d).slice(0,5).includes(n));
  oldLinks.forEach(link=>assert.ok(all(output.nodes).includes(link)));
});
test('unexpected links, order, counts, icons, wrappers and footer shapes fail closed',()=>{
  const cases=[
    d=>{links(d)[0].attrs.href='https://example.com/';},
    d=>{links(d)[0].attrs.onclick='alert(1)';},
    d=>{all(links(d)[0].children).find(n=>n.tag==='img').attrs.src='/other.png';},
    d=>{const list=all([footer(d)]).find(n=>n.attrs.class==='social-icons');[list.children[1],list.children[3]]=[list.children[3],list.children[1]];},
    d=>{const list=all([footer(d)]).find(n=>n.attrs.class==='social-icons');list.children.splice(1,1);},
    d=>{links(d)[0].children.push({tag:'span',attrs:{},children:[]});},
    d=>{footer(d).attrs.class='other';},
    d=>{footer(d).children.push(structuredClone(links(d)[0]));},
    d=>{d.nodes.push(structuredClone(footer(d)));},
    d=>{all([footer(d)]).find(n=>n.attrs.class==='social-profiles').attrs.class='other';},
    d=>{d.nodes= [];},
  ];
  for(const mutate of cases){const d=structuredClone(sitePages['/about-us']);mutate(d);assert.throws(()=>adaptFooterSocials(d),/incompatible captured footer/);}
  assert.throws(()=>adaptFooterSocials(adaptFooterSocials(sitePages['/about-us'])),/incompatible captured footer/);
});
