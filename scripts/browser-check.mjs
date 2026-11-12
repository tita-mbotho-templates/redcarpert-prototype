import {chromium} from 'playwright'; import fs from 'node:fs'; import assert from 'node:assert/strict';
(async()=>{let browser=await chromium.launch({headless:true,args:['--no-sandbox']});let results=[];const routes=JSON.parse(fs.readFileSync('.generated/routes.json'));
for(let width of [1440,768,390])for(let route of routes){let page=await browser.newPage({viewport:{width,height:900}}),errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400 && r.url().startsWith('http://localhost:4173'))failed.push(r.status()+' '+r.url())});page.on('requestfailed',r=>{if(r.url().startsWith('http://localhost:4173'))failed.push(r.url()+': '+r.failure().errorText)});await page.goto('http://localhost:4173/redcarpert-prototype'+(route==='/'?'/':route+'/'),{waitUntil:'domcontentloaded'});await page.waitForTimeout(1600);
let metrics=await page.evaluate(()=>({title:document.title,html:document.documentElement.outerHTML.length,transfer:performance.getEntriesByType('resource').reduce((a,r)=>a+r.transferSize,0),load:performance.getEntriesByType('navigation')[0].loadEventEnd,header:document.querySelector('#header')?.getBoundingClientRect().toJSON(),bodyWidth:document.body.scrollWidth,broken:[...document.images].filter(i=>i.getClientRects().length&&i.complete&&!i.naturalWidth&&i.src.startsWith(location.origin)).map(i=>i.src)}));
if(['/','/product','/digital-lookbook'].includes(route)){await page.waitForTimeout(600);await page.screenshot({path:'/tmp/after-'+width+'-'+(route.split('/')[1]||'home')+'.png'});}
if(route==='/digital-lookbook'){
 assert.equal(await page.locator('[data-book-page]').count(),10);
 await page.getByRole('button',{name:'Next page',exact:true}).click();
 await page.waitForTimeout(1100);
 assert.match(await page.locator('[data-book-status]').textContent(),/Page 2 of 10/);
 await page.getByRole('button',{name:'Previous page',exact:true}).click();
 await page.waitForTimeout(1100);
 assert.match(await page.locator('[data-book-status]').textContent(),/Page 1 of 10/);
}
await page.locator('#footer .redcarpert-footer-book').click();assert(await page.locator('#enquiry-preview').evaluate(d=>d.open));const approvedHref=new URL(await page.locator('#enquiry-preview [data-whatsapp-send]').getAttribute('href'));assert.equal(approvedHref.hostname,'wa.me');assert.equal(approvedHref.pathname,'/27680458811');assert(approvedHref.searchParams.get('text')?.includes('Redcarpert'),route+' WhatsApp message');await page.keyboard.press('Escape');assert(!(await page.locator('#enquiry-preview').evaluate(d=>d.open)));
await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(2200);

assert.deepEqual(errors,[],route+' JavaScript errors');assert.deepEqual(failed,[],route+' failed resources');assert.deepEqual(metrics.broken,[],route+' broken images');assert(metrics.bodyWidth<=width+1,route+' horizontal overflow');results.push({width,route,...metrics,errors,failed});await page.close();}
let page=await browser.newPage();let response=await page.goto('http://localhost:4173/redcarpert-prototype/not-a-page/');results.push({route:'404',status:response.status(),text:await page.locator('h1').textContent()});fs.writeFileSync('/tmp/10-after.json',JSON.stringify(results,null,2));await browser.close();console.log('Completed',results.length,'cases');})();
