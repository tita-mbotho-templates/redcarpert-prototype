import { chromium } from 'playwright';
import assert from 'node:assert/strict';

/** Real StPageFlip regression, not the CDN-blocked fallback test.
 * Isolate flipping from the externally hosted Pexels image availability. */
const browser = await chromium.launch({args:['--no-sandbox']});
const root = 'http://localhost:4173/redcarpert-prototype/digital-lookbook/';
try {
  for (const width of [1440, 768, 390]) {
    const mobile = width === 390;
    const page = await browser.newPage({
      viewport: {width,height:900},
      isMobile:mobile,
      hasTouch:mobile,
      reducedMotion:'no-preference',
    });
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://images.pexels.com/**',route=>route.abort());
    await page.goto(root,{waitUntil:'domcontentloaded'});
    const book=page.locator('#redcarpert-flipbook');
    await book.locator('.stf__block').waitFor({timeout:30000});
    assert.equal(await book.getAttribute('data-engine'),'page-flip','must use real enhanced reader');
    assert.equal(await page.locator('[data-book-page]').count(),10);
    const current=async()=>Number(await book.getAttribute('data-current-page'));
    const progresses=async(previous,direction)=>{
      await page.waitForFunction(
        ({previous,direction})=>{
          const current=Number(document.querySelector('#redcarpert-flipbook')?.dataset.currentPage);
          return direction>0 ? current>previous : current<previous;
        },{previous,direction},{timeout:12000}
      );
      await page.waitForTimeout(880);
      const now=await current();
      assert(direction>0?now>previous:now<previous,'page-turn stalled');
      return now;
    };
    const next=page.getByRole('button',{name:'Next page',exact:true});
    const previous=page.getByRole('button',{name:'Previous page',exact:true});
    let position=await current();
    assert.equal(position,1,'starts on cover');
    let count=0;
    while(position<10 && count<10){
      assert.equal(await next.isDisabled(),false,'next disabled before back cover');
      await next.click();
      position=await progresses(position,1);
      count++;
    }
    assert.equal(position,10,'reached back cover across all spreads');
    assert.equal(await next.isDisabled(),true);
    await previous.click();
    position=await progresses(position,-1);
    await book.focus();
    await page.keyboard.press('ArrowLeft');
    position=await progresses(position,-1);
    await page.keyboard.press('ArrowRight');
    position=await progresses(position,1);
    count=0;
    while(position>1 && count<10){
      await previous.click();
      position=await progresses(position,-1);
      count++;
    }
    assert.equal(position,1,'returned to front cover');
    assert.equal(await previous.isDisabled(),true);
    if (mobile) {
      // Previous/Next controls sit below the book. After navigating with
      // buttons, the book can be outside the viewport: touch coordinates
      // would otherwise land on the page background rather than the book.
      const livePage=book.locator('.stf__block');
      await livePage.scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      const bounds=await livePage.boundingBox();
      assert(bounds,'animated book is visible on mobile');
      const y=Math.max(35,Math.min(865,bounds.y+bounds.height*.5));
      const x1=bounds.x+bounds.width*.82;
      const x2=bounds.x+bounds.width*.14;
      const target=await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.className??'none',{x:x1,y});
      console.log('Mobile enhanced swipe target',JSON.stringify({bounds,x1,x2,y,target}));
      const session=await page.context().newCDPSession(page);
      await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y}]});
      // StPageFlip treats a gesture as a swipe only when it finishes within
      // 250 ms. Six 55-ms pauses were intentionally producing a drag, not a
      // swipe; dispatch continuous motion without artificial slow delays.
      const started=Date.now();
      for(let i=1;i<=5;i++){
        await session.send('Input.dispatchTouchEvent',{
          type:'touchMove',touchPoints:[{x:x1+(x2-x1)*i/5,y}]
        });
      }
      console.log('Mobile swipe gesture dispatch duration',Date.now()-started,'ms');
      await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      position=await progresses(1,1);
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'no horizontal overflow');
    assert.deepEqual(errors,[],'no JavaScript errors');
    console.log('Enhanced lookbook PASS',width,'px, at',position,'last page, real vendor loaded');
    await page.close();
  }
} finally { await browser.close(); }
