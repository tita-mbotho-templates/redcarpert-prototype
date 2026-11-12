import assert from 'node:assert/strict';
import test from 'node:test';
import {existsSync, readFileSync} from 'node:fs';
import {sitePages} from '../src/data/site.ts';
import {adaptFooterSocials} from '../src/lib/footer-social-adapter.ts';
import {addHomepageFooter} from '../src/lib/homepage-footer.ts';
import {correctFooterLinks} from '../src/lib/footer-link-corrections.ts';
import {adaptFooterBranding} from '../src/lib/footer-branding-adapter.ts';
import {adaptEditorialDocument} from '../src/lib/editorial-pages.ts';
import {modernizeSiteIcons} from '../src/lib/modern-icons.ts';

const all=a=>a.flatMap(n=>typeof n==='string'?[]:[n,...all(n.children)]);
const find=(doc,predicate)=>all(doc.nodes).filter(predicate);
function fixture(route){
  const source=route==='/digital-lookbook'?{...sitePages['/about-us'],route}:sitePages[route];
  const socials=adaptFooterSocials(source);
  const home=addHomepageFooter(socials,sitePages['/about-us']);
  const corrected=correctFooterLinks(home);
  return adaptEditorialDocument(adaptFooterBranding(corrected));
}
const getText=n=>n.children.map(c=>typeof c==='string'?c:getText(c)).join('');

test('every approved editorial footer has modern Brands social icons, minimal fitting copy and one WhatsApp CTA',()=>{
  for(const route of ['/','/about-us','/contact-us','/our-brides','/digital-lookbook']){
    const before=fixture(route),json=JSON.stringify(before);
    const doc=modernizeSiteIcons(before);
    const footer=find(doc,n=>n.attrs['data-redcarpert-footer']==='true')[0];
    assert(footer,route+' missing footer');
    const cols=all([footer]).find(n=>n.attrs.class?.includes('redcarpert-footer-columns'));
    const columns=cols.children.filter(n=>typeof n!=='string');
    assert.equal(columns.length,3,route+' must retain three columns');
    assert(getText(columns[2]).includes('FITTINGS'));
    assert(getText(columns[2]).includes('Book a fitting'));
    assert(!getText(columns[2]).includes('Via WhatsApp'));
    const list=all([columns[0]]).find(n=>n.tag==='ul'&&n.attrs.class==='social-icons');
    assert.equal(list.children.filter(n=>typeof n!=='string').length,6);
    const logos=all([list]).filter(n=>n.tag==='i');
    assert.deepEqual(logos.map(n=>n.attrs.class),[
      'fa-brands fa-instagram','fa-brands fa-youtube','fa-brands fa-x-twitter',
      'fa-brands fa-pinterest-p','fa-brands fa-tiktok','fa-brands fa-whatsapp'
    ]);
    const active=all([footer]).filter(n=>n.attrs['data-whatsapp-preview']==='');
    assert.equal(active.length,2,'only fitting action and footer WhatsApp are live CTAs');
    assert(active.every(n=>n.tag==='button'&&n.attrs['aria-haspopup']==='dialog'));
    assert.equal(all([list]).filter(n=>n.tag==='a').length,0,'do not restore unconfirmed social links');
    const floating=find(doc,n=>n.attrs.id==='redcarpert-floating-whatsapp')[0];
    assert.equal(floating.attrs.class,'redcarpert-whatsapp-float');
    assert.equal(all([floating]).filter(n=>n.tag==='button').length,2);
    assert(all([floating]).some(n=>n.attrs['data-dismiss-whatsapp']===''));
    assert(all([floating]).some(n=>n.attrs.class==='fa-solid fa-xmark'));
    assert(!all([floating]).some(n=>n.tag==='svg'),'legacy floating SVG is replaced');
    assert.equal(find(doc,n=>n.attrs.id==='ht-ctc-chat').length,0,'captured plugin wrapper must not ship');
    assert.equal(doc.nodes.at(-1),floating,'new widget should be top-level, without runtime remount');
    assert(find(doc,n=>n.tag==='i'&&n.attrs.class?.startsWith('fa-')).length>=10);
    assert.equal(JSON.stringify(before),json,'captured data must stay immutable');
  }
});

test('all custom legacy image and glyph icons become modern FA icons',()=>{
  const home=modernizeSiteIcons(fixture('/'));
  const arrow=find(home,n=>n.attrs.class?.includes('redcarpert-modern-down-arrow'))[0];
  assert(arrow&&all([arrow]).some(n=>n.attrs.class==='fa-solid fa-chevron-down'));
  const inner=modernizeSiteIcons(fixture('/about-us'));
  const up=find(inner,n=>n.attrs.class==='scroll-to-top')[0];
  assert(up&&all([up]).some(n=>n.attrs.class==='fa-solid fa-arrow-up'));
  const menu=find(inner,n=>n.attrs.class?.split(/\s+/).includes('mob-nav-btn'))[0];
  assert(menu&&all([menu]).some(n=>n.attrs.class==='fa-solid fa-bars'));
  const gallery=modernizeSiteIcons(fixture('/our-brides'));
  assert.equal(find(gallery,n=>n.attrs.class==='redcarpert-bride-zoom-badge').length,18);
  const close=find(gallery,n=>n.attrs['data-bride-preview-close']==='')[0];
  assert(all([close]).some(n=>n.attrs.class==='fa-solid fa-xmark'));
});

test('icon transformation refuses unexpected captured footer/WhatsApp structure',()=>{
  const broken=structuredClone(fixture('/about-us'));
  find(broken,n=>n.attrs.id==='ht-ctc-chat')[0].children=[];
  assert.throws(()=>modernizeSiteIcons(broken),/Modern icons .*floating icon shape/);
  const wrong=structuredClone(fixture('/'));
  find(wrong,n=>n.attrs.class==='redcarpert-footer-items')[1].children=[];
  assert.throws(()=>modernizeSiteIcons(wrong),/Modern icons .*fitting links/);
});

test('deleted icon artwork has no remaining published asset or stylesheet dependency',()=>{
 const obsolete=[
  'public/redcarpert/instagram.svg',
  'public/site-assets/3d94819dd14ede1760.png',
  'public/site-assets/4600dc5b99e2f02b67.png',
  'public/site-assets/3b9a6e23cf5c478efd.png',
  'public/site-assets/54721da2e3bb14d829.png',
  'public/site-assets/54680b5d97bca3e0c2.png',
  'public/site-assets/b4bfc950ddaf86c166.png',
 ];
 for(const path of obsolete)assert.equal(existsSync(path),false,'unused icon still checked in: '+path);
 const theme=readFileSync('public/site-assets/a397f1784786614528.css','utf8');
 for(const path of obsolete.filter(x=>x.startsWith('public/site-assets/')))
  assert(!theme.includes(path.split('/').at(-1)),'theme CSS still points to removed artwork: '+path);
 const runtime=readFileSync('src/client/SiteRuntime.js','utf8');
 assert(!runtime.includes('document.body.append(chat)'),'legacy WhatsApp remount should not return');
 assert(!runtime.includes('ht-ctc-chat'),'legacy WhatsApp wrapper should not return');
 const footerCSS=readFileSync('src/components/FooterBranding.css','utf8');
 assert(!footerCSS.includes('.social-icons img'),'unused image-based footer icon styling should not return');
 const galleryCSS=readFileSync('src/components/BridesGallery.css','utf8');
 assert(!galleryCSS.includes('button:after'),'old text-glyph gallery overlay should not return');
});
