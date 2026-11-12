import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { sitePages } from '../src/data/site.ts';
import { adaptNavigation } from '../src/lib/navigation-adapter.ts';
const find=(nodes,p)=>nodes.flatMap(n=>typeof n==='string'?[]:[...(p(n)?[n]:[]),...find(n.children,p)]);
const byId=(d,id)=>find(d.nodes,n=>n.attrs.id===id)[0];
const children=n=>n.children.filter(n=>typeof n!=='string');
const link=n=>children(n)[0];
const freeze=n=>{if(n&&typeof n==='object'&&!Object.isFrozen(n)){Object.freeze(n);Object.values(n).forEach(freeze)}return n};
const digest=()=>createHash('sha256').update(JSON.stringify(sitePages)).digest('hex');
const header=d=>byId(d,'header');
const icons=d=>find([header(d)],n=>n.attrs.class==='social-icons');

test('all 8 canonical headers map exactly six items and two real categories; no header socials or invented destinations',()=>{
  for(const original of Object.values(sitePages)){
    const d=adaptNavigation(original);const menu=children(byId(d,'menu-blog-layouts'));
    assert.deepEqual(menu.map(n=>link(n).children.join('')),['Home','Wedding Dresses','Digital Lookbook','Our Brides','About Us','Contact Us']);
    assert.deepEqual(menu.map(n=>link(n).attrs.href),['/','/product/','/digital-lookbook/','/our-brides/','/about-us/','/contact-us/']);
    assert.equal(menu[0].attrs.id,'menu-item-15418');
    const lookbook=link(menu[2]);assert.equal(lookbook.attrs.href,'/digital-lookbook/');assert.equal(lookbook.attrs['aria-disabled'],undefined);
    const categories=children(children(menu[1])[1]);
    assert.deepEqual(categories.map(n=>[link(n).children[0],link(n).attrs.href]),[['Mermaid','/product-category/mermaid/'],['Ball Gown','/product-category/ball_gown/']]);
    assert.equal(icons(d).length,0);
    for(const a of find([header(d)],n=>n.tag==='a'&&n.attrs.href)){
      assert.ok(['/', '/product/', '/product-category/mermaid/', '/product-category/ball_gown/', '/digital-lookbook/', '/our-brides/', '/about-us/', '/contact-us/'].includes(a.attrs.href));
    }
    assert.ok(menu[1].attrs.class.includes('menu-item-has-children'));assert.equal(children(menu[1])[1].attrs.class,'sub-menu');
  }
});

test('frozen captured sources never mutate; only changed nodes and ancestors are cloned, body/footer/cart/logo stay shared',()=>{
  const before=digest();freeze(sitePages);
  for(const original of Object.values(sitePages)){
    const d=adaptNavigation(original);
    const compare=(a,b)=>{
      if(typeof a==='string'){assert.equal(a,b);return}
      if(a.attrs.id==='header')return;
      assert.deepEqual(a.attrs,b.attrs);assert.equal(a.tag,b.tag);assert.equal(a.children.length,b.children.length);
      if(!find([a],n=>n.attrs.id==='header').length)assert.strictEqual(a,b);
      a.children.forEach((c,i)=>compare(c,b.children[i]));
    };
    original.nodes.forEach((n,i)=>compare(n,d.nodes[i]));
    assert.strictEqual(byId(d,'logo-container'),byId(original,'logo-container'));
    for(const cls of ['mobile-nav','pex-woo-cart-btn','pex-woo-cart']){
      const get=doc=>find([header(doc)],n=>n.attrs.class?.split(/\s+/).includes(cls));
      assert.deepEqual(get(d),get(original));get(original).forEach((n,i)=>assert.strictEqual(get(d)[i],n));
    }
    const socialWrapper=doc=>find([header(doc)],n=>n.attrs.class==='social-profiles')[0];
    assert.deepEqual(socialWrapper(d).attrs,socialWrapper(original).attrs);
    assert.deepEqual(socialWrapper(d).children,socialWrapper(original).children.filter(n=>n!==icons(original)[0]));
    for(const key of Object.keys(original).filter(k=>k!=='nodes'))assert.strictEqual(d[key],original[key]);
  }
  assert.equal(digest(),before);
});

test('active classes and aria-current follow actual routes, with no guessed dress-detail category',()=>{
  for(const [route,id]of [['/','15418'],['/product','15821'],['/product/page/2','15821'],['/product-category/mermaid','15421'],['/product-category/ball_gown','15422'],['/about-us','15416'],['/our-brides','16080'],['/contact-us','15417']]){
    const d=adaptNavigation(sitePages[route] ?? {...sitePages['/product'], route});
    assert.deepEqual(find([header(d)],n=>n.attrs['aria-current']==='page').map(n=>n.attrs.href),[link(byId(d,`menu-item-${id}`)).attrs.href]);
    assert.match(byId(d,`menu-item-${id}`).attrs.class,/current-menu-item/);
    if(id==='15421'||id==='15422')assert.match(byId(d,'menu-item-15821').attrs.class,/current-menu-parent/);
  }
  for(const route of ['/product/alpina','/product-category/bridal-bags','/product-tag/2024','/marka/bridal-vanesa-exclusive']){
    const d=adaptNavigation(sitePages[route]??{...sitePages['/'],route});
    assert.match(byId(d,'menu-item-15821').attrs.class,/current-menu-ancestor/);
    assert.equal(find([header(d)],n=>n.attrs['aria-current']).length,0);
    for(const id of ['15421','15422'])assert.doesNotMatch(byId(d,`menu-item-${id}`).attrs.class,/current[-_]/);
  }
  for(const route of ['/atelier-2','/store'])assert.equal(find([header(adaptNavigation({...sitePages['/product/arabella'],route}))],n=>/current[-_]/.test(n.attrs.class??'')).length,0);
  // Captured current flags cannot leak from another route or onto the Lookbook donor.
  const stale=structuredClone(sitePages['/product/arabella']);stale.route='/contact-us/';const d=adaptNavigation(stale);
  assert.equal(find([header(d)],n=>n.attrs['aria-current']==='page').length,1);
  assert.equal(link(byId(d,'menu-item-15417')).attrs['aria-current'],'page');assert.doesNotMatch(byId(d,'menu-item-16165').attrs.class,/current[-_]/);
});

test('new Digital Lookbook route selects its existing donor menu item',()=>{
  const source = { ...sitePages['/about-us'], route: '/digital-lookbook' };
  const adapted = adaptNavigation(source);
  const target = byId(adapted,'menu-item-16165');
  assert.match(target.attrs.class,/current-menu-item/);
  assert.equal(link(target).attrs.href,'/digital-lookbook/');
  assert.equal(link(target).attrs['aria-current'],'page');
});

test('invalid or ambiguous source structure fails closed without partial mutation',()=>{
  for(const mutate of [
    d=>{header(d).tag='div'},d=>{byId(d,'menu-blog-layouts').attrs.id='unknown'},
    d=>{link(byId(d,'menu-item-15418')).attrs.href='#3'},
    d=>{link(byId(d,'menu-item-16165')).children=['Something else']},
    d=>{byId(d,'menu-item-15821').attrs.class='menu-item menu-item-15821'},
    d=>{byId(d,'menu-item-15422').attrs.id='unknown'},
    d=>{children(byId(d,'menu-item-15821'))[1].children.push(structuredClone(byId(d,'menu-item-15422')))},
    d=>{icons(d)[0].children=[]},d=>{find(icons(d),n=>n.tag==='a')[0].attrs.href='https://unexpected.example/'},
    d=>{byId(d,'logo-container').children=[]},d=>{d.nodes.push(structuredClone(header(d)))},
    d=>{find([header(d)],n=>n.attrs.class==='navigation-container')[0].tag='section'},
    d=>{find([header(d)],n=>n.attrs.class==='mobile-nav')[0].attrs.class='unknown'},
  ]){
    const d=structuredClone(sitePages['/']);mutate(d);const before=JSON.stringify(d);
    assert.throws(()=>adaptNavigation(d),/incompatible captured header/);assert.equal(JSON.stringify(d),before);
  }
});
