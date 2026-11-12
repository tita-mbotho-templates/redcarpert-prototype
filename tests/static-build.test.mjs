import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import sharp from 'sharp';
const walk = dir => readdirSync(dir,{withFileTypes:true}).flatMap(file=>file.isDirectory()?walk(path.join(dir,file.name)):[path.join(dir,file.name)]);
const available = existsSync('dist/index.html');
test('static deployment contains complete approved pages, local paths and no application server', {skip:!available},()=>{
 const files=walk('dist'), htmlFiles=files.filter(f=>f.endsWith('.html'));
 const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
 assert.equal(routes.length,16);
 assert.equal(htmlFiles.length,routes.length+1);
 for(const route of routes){
  const html=readFileSync(path.join('dist',route,'index.html'),'utf8');
  assert.match(html,/<!doctype html>/i);assert.match(html,/<header id="header"/);assert.match(html,/<footer/);assert.match(html,/WhatsApp Enquiry Preview/);
  assert.doesNotMatch(html,/__NEXT_DATA__|self\.__next|\/_next\/|data-settings=/);
  for(const [,url] of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)){
   assert(url.startsWith('/redcarpert-prototype/'),url);
   const local=path.join('dist',url.slice('/redcarpert-prototype/'.length));
   assert(existsSync(local)||existsSync(path.join(local,'index.html')),url);
  }
  const handoffs=[...html.matchAll(/<a\b[^>]*\bdata-whatsapp-send\b[^>]*\bhref="([^"]+)"[^>]*>/gi)];
  assert.equal(handoffs.length,1,route+' must have exactly one approved WhatsApp handoff');
  const sendLink=handoffs[0][0];
  const sendUrl=new URL(handoffs[0][1].replaceAll('&amp;','&'));
  assert.equal(sendUrl.origin,'https://wa.me');
  assert.equal(sendUrl.pathname,'/27680458811');
  assert(sendUrl.searchParams.get('text')?.includes('Hello Redcarpert Wedding Dresses!'));
  assert.match(sendLink,/target="_blank"/);
  assert.match(sendLink,/rel="noopener noreferrer"/);
  const sample=route.match(/\/product\/preview\/sample-(\d{2})-/);
  if(sample)assert(sendUrl.searchParams.get('text')?.includes('Sample '+sample[1]),
    route+' must retain its individual sample-dress enquiry');
 }
 assert(!files.some(f=>f.includes('/api/')||f.includes('_next')||f.includes('documents/')));
 assert(!existsSync('dist/product/arabella/index.html'));
 const lock=JSON.parse(readFileSync('package-lock.json','utf8'));
 for(const name of ['next','react','react-dom'])assert(!lock.packages['node_modules/'+name]);
 assert.match(readFileSync('dist/404.html','utf8'),/Page not found/);
 const pdf=readFileSync('dist/digital-lookbook/Redcarpert-Sample-Lookbook.pdf');assert.equal(pdf.subarray(0,8).toString(),'%PDF-1.4');assert.match(pdf.toString('latin1'),/\/Count 2/);
});
test('copied classic scripts remain valid and every page uses modern Font Awesome controls',{skip:!available},()=>{
 for(const file of walk('dist/site-assets').filter(f=>f.endsWith('.js')))new vm.Script(readFileSync(file,'utf8'),{filename:file});
 const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
 for(const route of routes){
  const html=readFileSync(path.join('dist',route,'index.html'),'utf8');
  assert.match(html,/fontawesome-free@7\.3\.1\/css\/all\.min\.css/);
  assert.match(html,/fa-brands fa-whatsapp/,route+' must contain branded WhatsApp icon');
  assert.match(html,/id="redcarpert-floating-whatsapp"/,route+' must use modern widget');
  assert.doesNotMatch(html,/id="ht-ctc-chat"|htwasqicona-chat|\/redcarpert\/instagram\.svg/,route+' must not ship old WhatsApp markup or social SVG');
  assert.match(html,/redcarpert-whatsapp-float-dismiss/,route+' missing accessible dismiss button');
  assert.match(html,/data-dismiss-whatsapp/,route+' missing close behaviour');
  assert.match(html,/class="redcarpert-footer-social-whatsapp"/,route+' must provide footer WhatsApp');
  assert.match(html,/class="redcarpert-footer-book"/,route+' must provide a fitting CTA');
  assert.doesNotMatch(html,/FITTING ENQUIRIES|Via WhatsApp/,route+' contains old redundant footer text');
 }
});

test('ten-page interactive book and eight shared Pexels products are published without local copies',{skip:!available},()=>{
 const book=readFileSync('dist/digital-lookbook/index.html','utf8');
 assert.equal((book.match(/data-book-page=/g)||[]).length,10);
 assert.equal((book.match(/class="redcarpert-book-logo"/g)||[]).length,2);
 assert.match(book,/data-book-next/); assert.match(book,/data-book-previous/);
 const gallery=readFileSync('dist/product/index.html','utf8');
 assert.equal((gallery.match(/data-catalogue-id=/g)||[]).length,8);
 for(const [category,count] of [['mermaid',4],['ball_gown',4]]) {
  const html=readFileSync('dist/product-category/'+category+'/index.html','utf8');
  assert.equal((html.match(/data-catalogue-id=/g)||[]).length,count);
 }
 const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
 assert.equal(routes.filter(p=>p.startsWith('/product/preview/')).length,8);
 assert.equal((book.match(/https:\/\/images\.pexels\.com\/photos\//g)||[]).length,9);
 for(const route of routes.filter(p=>p.startsWith('/product/preview/'))) {
  const html=readFileSync('dist'+route+'/index.html','utf8');
  assert.match(html,/https:\/\/images\.pexels\.com\/photos\//);
  assert.match(html,/not confirmed Redcarpert inventory/i);
 }
});


test('release readiness: all public pages have Redcarpert metadata and safe outbound links',{skip:!available},()=>{
  const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
  assert.equal(routes.length,16);
  const expectedTitles={
    '/product':'Wedding Dresses | Redcarpert Wedding Dresses',
    '/product-category/mermaid':'Mermaid Wedding Dresses | Redcarpert',
    '/product-category/ball_gown':'Ball Gown Wedding Dresses | Redcarpert',
  };
  for(const route of routes){
    const html=readFileSync(path.join('dist',route,'index.html'),'utf8');
    const title=html.match(/<title>([^<]+)<\/title>/i)?.[1];
    const description=html.match(/<meta name="description" content="([^"]+)"/i)?.[1];
    assert(title?.includes('Redcarpert'),route+' missing Redcarpert page title');
    assert(description?.trim(),route+' missing SEO description');
    assert(!/bridal[\s_-]*vanesa|vanesabridal|nirvanatakipcim|tatli media|Ürün kategorileri/i.test(title),
      route+' exposes inherited reference-site title');
    if(expectedTitles[route])assert.equal(title,expectedTitles[route]);
    assert(html.includes('Nothing is sent until you press Send in WhatsApp.'),
      route+' missing explicit WhatsApp user-send disclosure');
    assert(!/(?:href|action)="(?:https?:\/\/[^"]*whatsapp\.(?:com|net)|whatsapp:|intent:)/i.test(html),
      route+' contains an unapproved WhatsApp/intent destination');
    for(const [,href] of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)){
      assert(!/^(?:javascript:|data:|vbscript:)/i.test(href),route+' unsafe anchor '+href);
      if(/^https?:\/\//i.test(href)){
        const outbound=new URL(href.replaceAll('&amp;','&'));
        const host=outbound.hostname.toLowerCase();
        if (host==='www.google.com') {
          assert.equal(route,'/contact-us','only the Contact page may link to an external map');
          assert.equal(outbound.pathname,'/maps/search/','external Google link must be a Maps search only');
          assert.equal(outbound.searchParams.get('api'),'1');
          assert.equal(outbound.searchParams.get('query'),'Sunnyside, Pretoria, South Africa');
          assert.equal(outbound.searchParams.size,2,'external map link must not contain tracking parameters');
          continue;
        }
        assert(['images.pexels.com','wa.me'].includes(host),
          route+' links to an unapproved external site: '+href);
        if(outbound.hostname==='wa.me') {
          assert.equal(outbound.pathname,'/27680458811');
          assert.equal(outbound.searchParams.size,1,'WhatsApp URL can contain only the message query');
          assert(outbound.searchParams.get('text')?.includes('Redcarpert'));
        }
      }
    }
    for(const [,resource] of html.matchAll(/<(?:img|link|script)\b[^>]*\b(?:href|src)="([^"]+)"/gi)){
      assert(!/(?:bridalvanesa\.com|nirvanatakipcim\.com|instagram\.com\/bridal_vanesa)/i.test(resource),
        route+' contains a reference-site asset: '+resource);
    }
  }
});

test('release readiness: public GitHub Pages deployment requires explicit manual approval',()=>{
  const yaml=readFileSync('.github/workflows/pages.yml','utf8');
  assert.match(yaml,/workflow_dispatch:/);
  assert.match(yaml,/approve_deployment:/);
  assert.match(yaml,/default:\s*false/);
  assert.match(yaml,/if: github\.ref == 'refs\/heads\/main' && inputs\.approve_deployment/);
  assert.doesNotMatch(yaml,/^\s+(?:push|pull_request):/m,'deployment should never run on push or PR');
  const verification=readFileSync('.github/workflows/verify.yml','utf8');
  assert.match(verification,/workflow_dispatch:/);
  assert.doesNotMatch(verification,/^\s+(?:push|pull_request):/m,'verification should remain opt-in');
  assert.match(yaml,/actions\/deploy-pages@/);
});

test('Redcarpert browser-tab and touch icons are generated from the new bridal monogram on every page', {skip:!available}, async()=>{
 const source='public/redcarpert/brand/redcarpert-bridal-monogram.svg';
 const output=[
  {size:32,name:'redcarpert-bridal-favicon-v2-32.png',rel:'icon'},
  {size:180,name:'redcarpert-bridal-touch-v2-180.png',rel:'apple-touch-icon'},
 ];
 const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
 for(const {size,name,rel} of output){
  const target='dist/redcarpert/brand/'+name;
  assert(existsSync(target),'missing generated icon: '+target);
  const expected=await sharp(source)
    .resize(size,size,{fit:'contain',background:{r:0,g:0,b:0,alpha:1}}).png().toBuffer();
  const actual=readFileSync(target);
  assert(actual.equals(expected),name+' must be derived from the approved current Redcarpert logo');
  const info=await sharp(actual).metadata();
  assert.equal(info.format,'png');
  assert.equal(info.width,size);
  assert.equal(info.height,size);
  for(const route of routes){
   const html=readFileSync(path.join('dist',route,'index.html'),'utf8');
   assert(html.includes('rel="'+rel+'"'),route+' must declare '+rel);
   assert(html.includes('href="/redcarpert-prototype/redcarpert/brand/'+name+'"'),route+' must point to current branded icon '+name);
   assert(!html.includes('cropped-logo-2-1'),route+' must not reference the old reference-site tab icon');
  }
  const missing=readFileSync('dist/404.html','utf8');
  assert(missing.includes('href="/redcarpert-prototype/redcarpert/brand/'+name+'"'),'404 page must use the current '+rel);
 }
});

test('Implementation 22: every static page starts with a bounded, branded global loading screen', {skip:!available},async()=>{
 const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
 const generated='dist/redcarpert/brand/redcarpert-logo-optimized.webp';
 assert(existsSync(generated),'missing derived logo used by all pages');
 const original='public/redcarpert/brand/redcarpert-logo.png';
 const optimized=readFileSync(generated);
 assert(optimized.length<readFileSync(original).length/2,'approved logo derivative should be considerably smaller');
 const info=await sharp(optimized).metadata();
 assert.equal(info.format,'webp');
 assert(info.width<=640&&info.width>200);
 for(const route of routes){
  const html=readFileSync(path.join('dist',route,'index.html'),'utf8');
  const loader=html.indexOf('id="redcarpert-page-loader"');
  const header=html.indexOf('<header id="header"');
  assert(loader>0&&header>loader,route+' loader must precede site header');
  assert.match(html,/id="redcarpert-loader-critical"/,route+' loader critical CSS missing');
  assert.match(html,/redcarpert-logo-optimized\.webp/,route+' must render optimised approved logo');
  assert.match(html,/Preparing your bridal experience/,route+' missing branded status');
  assert.match(html,/redcarpertLoaderFallback=setTimeout/,route+' must fail open if JS stalls');
  assert.match(html,/<noscript><style>#redcarpert-page-loader\{display:none!important\}<\/style><\/noscript>/,
    route+' must fail open with JavaScript disabled');
  assert.match(html,/role="status" aria-live="polite"/,route+' loader must be accessible');
  if(route==='/'){
   const year=new Date().getFullYear();
   assert.match(html,new RegExp('data-collection-year="start"[^>]*>'+year+'<'), 'homepage first year fallback should match build year');
   assert.match(html,new RegExp('data-collection-year="end"[^>]*>'+(year+1)+'<'), 'homepage next year fallback should match build year');
   assert(html.includes(' Collectıon'), 'keep the approved collection heading wording');
   // Apply homepage-only transparent header rules before JavaScript arrives.
   assert.match(html,/<body class="[^"]*\bredcarpert-home-native\b/,
     'homepage must carry its transparent overlay class from the first paint');
   assert(html.includes('<link rel="preconnect" href="https://ik.imagekit.io">'),
     'homepage should preconnect to client ImageKit image host');
   assert(html.includes('href="https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/home-page/home-page-1.webp?updatedAt=1794351596508" as="image" type="image/webp" fetchpriority="high"'),
     'first client photograph should be priority-preloaded');
   assert(html.includes('data-hero-url="https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/home-page/home-page-1.webp?updatedAt=1794351596508"'),
     'homepage loader should wait for first client photograph');
   const imagekitUrls=["https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/home-page/home-page-1.webp?updatedAt=1794351596508","https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/home-page/home-page-2.webp?updatedAt=1794351597603","https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/home-page/home-page-3.webp?updatedAt=1794351600184"];
   for(const url of imagekitUrls)assert(html.includes(url),'homepage missing approved photo '+url);
   assert(html.indexOf('rel="preload"')<html.indexOf('src="\/redcarpert-prototype\/redcarpert\/brand\/redcarpert-logo-optimized.webp"'),
    'hero preload should be declared before loading logo');
  } else {
   assert(!html.includes('data-hero-url='),route+' must not load the homepage hero');
   assert(!html.includes('ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/home-page/'),
     route+' should not request homepage-only photography');
   assert.doesNotMatch(html,/<body class="[^"]*\bredcarpert-home-native\b/,
     route+' must retain its approved interior header styling');
  }
 }
});
