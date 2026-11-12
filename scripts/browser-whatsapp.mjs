import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Preview must always precede the wa.me handoff. No real message is sent.
// The mobile floating control is hidden, but footer and dress enquiries remain.
const browser=await chromium.launch({args:['--no-sandbox']});
try {
  for(const {route,width,name,trigger} of [
    {route:'/',width:1440,name:'homepage floating enquiry',trigger:'#redcarpert-floating-whatsapp [data-whatsapp-preview]'},
    {route:'/product/preview/sample-01-mermaid/',width:390,name:'Mermaid dress fitting',trigger:'[data-detail-preview] [data-whatsapp-preview]'},
    {route:'/product/preview/sample-02-ball-gown/',width:768,name:'Ball Gown dress fitting',trigger:'[data-detail-preview] [data-whatsapp-preview]'},
    {route:'/contact-us/',width:375,name:'mobile footer fitting',trigger:'#footer .redcarpert-footer-book'},
  ]){
    const context=await browser.newContext({viewport:{width,height:900}});
    await context.route('https://wa.me/**',requested=>requested.fulfill({
      status:200,contentType:'text/html',
      body:'<!doctype html><html><head><title>WhatsApp test handoff</title></head><body>Intercepted before network</body></html>',
    }));
    const page=await context.newPage();
    await page.goto('http://localhost:4173/redcarpert-prototype'+route,{waitUntil:'domcontentloaded'});
    if(width<=640)assert.equal(await page.locator('#redcarpert-floating-whatsapp').isHidden(),true,name+' hides the mobile floating widget');
    else assert.equal(await page.locator('#redcarpert-floating-whatsapp [data-whatsapp-preview]').isVisible(),true,name+' has floating CTA');
    await page.locator(trigger).click();
    assert.equal(await page.locator('#enquiry-preview').evaluate(d=>d.open),true,name+' shows review first');
    const link=page.locator('#enquiry-preview [data-whatsapp-send]');
    assert.equal(await link.getAttribute('target'),'_blank',name+' opens WhatsApp in a new tab');
    const href=new URL(await link.getAttribute('href'));
    assert.equal(href.hostname,'wa.me');
    assert.equal(href.pathname,'/27680458811');
    const message=href.searchParams.get('text');
    assert(message?.includes('Hello Redcarpert Wedding Dresses!'));
    if(name==='Mermaid dress fitting')assert(message.includes('Sample 01')&&message.includes('Mermaid'));
    if(name==='Ball Gown dress fitting')assert(message.includes('Sample 02')&&message.includes('Ball Gown'));
    const [popup]=await Promise.all([context.waitForEvent('page'),link.click()]);
    await popup.waitForLoadState('domcontentloaded');
    assert.equal(popup.url(),href.toString(),name+' opens the reviewed message URL');
    assert.equal(await popup.title(),'WhatsApp test handoff');

    if(width===1440){
      await page.keyboard.press('Escape');
      const close=page.locator('#redcarpert-floating-whatsapp [data-dismiss-whatsapp]');
      assert.equal(await close.isVisible(),true,'desktop dismiss X must be visible');
      await close.click();
      assert.equal(await page.locator('#redcarpert-floating-whatsapp').isHidden(),true,'floating widget should disappear');
      assert.equal(await page.evaluate(()=>sessionStorage.getItem('redcarpert-floating-whatsapp-dismissed')),'1');
      await page.goto('http://localhost:4173/redcarpert-prototype/about-us/',{waitUntil:'domcontentloaded'});
      assert.equal(await page.locator('#redcarpert-floating-whatsapp').isHidden(),true,'dismissal must persist across pages in same tab');
      await page.locator('#footer .redcarpert-footer-social-whatsapp').click();
      assert.equal(await page.locator('#enquiry-preview').evaluate(d=>d.open),true,'footer WhatsApp remains available');
    }
    await context.close();
    console.log('WhatsApp handoff PASS',width,name);
  }
}finally {await browser.close();}
