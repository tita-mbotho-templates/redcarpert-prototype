import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import products from '../src/data/products.json' with { type: 'json' };

/** Test deterministic book behaviour without relying on third-party CDN availability. */
const browser = await chromium.launch({args:['--no-sandbox']});
try {
 for (const width of [1440, 768, 390]) {
  const mobile = width === 390;
  const page = await browser.newPage({viewport:{width,height:900},isMobile:mobile,hasTouch:mobile});
  const errors = [];
  page.on('pageerror',error=>errors.push(error.message));
  // Force the built-in fallback so the test never requires a remote animation vendor.
  await page.route('https://cdn.jsdelivr.net/npm/page-flip@2.0.7/**',route=>route.abort());
  await page.route('https://images.pexels.com/**',route=>route.abort());
  await page.goto('http://localhost:4173/redcarpert-prototype/digital-lookbook/',{waitUntil:'domcontentloaded'});
  await page.locator('#redcarpert-flipbook[data-engine="fallback"]').waitFor({timeout:10000});
  assert.equal(await page.locator('[data-book-page]').count(),10);
  assert.equal(await page.locator('[data-book-price]').count(),8);
  const expectedPrices = new Map(products.dresses.map(({id,priceZar})=>[
   id,priceZar===null?'Price to be confirmed':'R '+new Intl.NumberFormat('en-ZA',{maximumFractionDigits:0}).format(priceZar)
  ]));
  const renderedPrices=await page.locator('[data-book-price]').evaluateAll(nodes=>nodes.map(node=>[node.getAttribute('data-book-price'),node.textContent]));
  assert.equal(new Set(renderedPrices.map(([id])=>id)).size,8);
  assert(renderedPrices.every(([id,price])=>expectedPrices.has(id)&&price===expectedPrices.get(id)),
   'lookbook prices must match products.json');
  assert.equal(await page.locator('.redcarpert-book-logo').count(),2);
  assert.equal(await page.locator('.redcarpert-book-dress').count(),8);
  assert.equal(await page.locator('.redcarpert-book-dress[data-sample-id^="sample-mermaid"]').count(),4);
  assert.equal(await page.locator('.redcarpert-book-dress[data-sample-id^="sample-ball-gown"]').count(),4);
  assert.equal(await page.locator('.redcarpert-book-dress a[href*="/product/preview/"]').count(),8);
  const next = page.getByRole('button',{name:'Next page',exact:true});
  const previous = page.getByRole('button',{name:'Previous page',exact:true});
  for(let i=2;i<=10;i++){
   await next.click();
   assert.equal(await page.locator('[data-book-status]').textContent(),'Page '+i+' of 10');
   assert.equal(await page.locator('.redcarpert-book-page.is-current').count(),1);
  }
  assert(await next.isDisabled());
  await previous.click();
  assert.equal(await page.locator('[data-book-status]').textContent(),'Page 9 of 10');
  await page.locator('#redcarpert-flipbook').focus();
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('[data-book-status]').textContent(),'Page 8 of 10');
  if(mobile){
   const book=page.locator('#redcarpert-flipbook');
   const box=await book.boundingBox();
   assert(box);
   const client=await page.context().newCDPSession(page);
   const y=box.y+box.height/2;
   await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*.8,y}]});
   await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*.2,y}]});
   await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   assert.equal(await page.locator('[data-book-status]').textContent(),'Page 9 of 10');
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  assert.deepEqual(errors,[]);
  await page.close();
 }
 console.log('Book fallback, keyboard, mobile swipe, pages, image disclosures and responsive layout passed.');
} finally { await browser.close(); }
