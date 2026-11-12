import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});let results=[];
for(const width of [1440,768,390]){
const p=await b.newPage({viewport:{width,height:900}});let errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://localhost:4173/redcarpert-prototype/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(2600);
if(width===1440){
  await p.keyboard.press('ArrowDown');
  await p.waitForTimeout(650);
  assert(await p.evaluate(()=>scrollY>0),'native keyboard scrolling');
  await p.mouse.wheel(0,320);
  await p.waitForTimeout(650);
  assert(await p.evaluate(()=>scrollY>100),'native wheel scrolling');
  await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
  await p.waitForTimeout(100);
  assert(await p.evaluate(()=>document.querySelector('footer[data-homepage-footer]').getBoundingClientRect().top<innerHeight),'footer follows photos in natural flow');
  // The approved header tucks away on downward scroll; reveal it with
  // an upward wheel gesture before testing the logo's Home reset.
  await p.mouse.move(width/2,450);
  await p.mouse.wheel(0,-340);
  await p.waitForTimeout(550);
  assert(await p.evaluate(()=>!document.body.classList.contains('redcarpert-header-tucked')),'header returns on upward scroll');
  await p.locator('#header #logo-container > a').click();
  await p.waitForFunction(()=>scrollY<5,{},{timeout:5000});
}
else{await p.locator('#header .mobile-nav').click();await p.waitForTimeout(500);assert(await p.locator('#header .mob-nav-menu').isVisible());await p.locator('#header .mob-nav-arrow').click();await p.waitForTimeout(500);assert(await p.locator('#header .mob-nav-menu .sub-menu').isVisible());await p.locator('#header .mob-nav-menu a').filter({hasText:/^Mermaid$/}).click();await p.waitForTimeout(1500);assert(p.url().includes('/redcarpert-prototype/product-category/mermaid'));}
await p.goto('http://localhost:4173/redcarpert-prototype/product/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500);assert.equal(await p.locator('[data-catalogue-id]').count(),8);await p.locator('[data-catalogue-id="sample-mermaid"] a').click();await p.waitForTimeout(1600);assert(p.url().includes('/product/preview/sample-01-mermaid'));await p.getByRole('button',{name:/Enquire about a fitting/i}).click();assert.match(await p.locator('#enquiry-preview .message').textContent(),/Sample 01/);const liveLink=new URL(await p.locator('#enquiry-preview [data-whatsapp-send]').getAttribute('href'));assert.equal(liveLink.hostname,'wa.me');assert.equal(liveLink.pathname,'/27680458811');assert.match(liveLink.searchParams.get('text'),/Sample 01.*Mermaid/);assert.equal(await p.locator('#enquiry-preview [data-whatsapp-send]').getAttribute('target'),'_blank');await p.context().grantPermissions(['clipboard-read','clipboard-write']);const message=await p.locator('#enquiry-preview .message').textContent();await p.getByRole('button',{name:'Copy Message'}).click();assert.equal(await p.evaluate(()=>navigator.clipboard.readText()),message);await p.keyboard.press('Escape');await p.locator('.wpgis-popup').click();await p.waitForTimeout(500);assert(await p.locator('.fancybox-container').isVisible());await p.keyboard.press('Escape');await p.locator('.fancybox-container').waitFor({state:'hidden'});await p.evaluate(()=>scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(400);const topControl = p.locator('footer > .scroll-to-top');if(await topControl.isVisible()) await topControl.click();else await topControl.evaluate(control=>control.click());await p.waitForTimeout(1200);assert.equal(await p.evaluate(()=>Math.round(scrollY)),0);
await p.goto('http://localhost:4173/redcarpert-prototype/digital-lookbook/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(1400);const [download]=await Promise.all([p.waitForEvent('download'),p.getByRole('link',{name:'Download sample lookbook (PDF)'}).click()]);const file=await download.path();assert.equal(fs.readFileSync(file).subarray(0,8).toString(),'%PDF-1.4');assert.equal(download.suggestedFilename(),'Redcarpert-Sample-Lookbook.pdf');assert.deepEqual(errors,[]);results.push({width,homepageScroll:true,navigation:true,catalogue:true,sample:true,enquiry:true,zoom:true,scrollToTop:true,pdf:true});await p.close();}
fs.writeFileSync('/tmp/10-interactions.json',JSON.stringify(results,null,2));await b.close();console.log(results)})();
