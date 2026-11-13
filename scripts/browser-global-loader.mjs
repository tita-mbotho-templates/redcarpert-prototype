import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';

const origin='http://localhost:4173/redcarpert-prototype';
const browser=await chromium.launch({args:['--no-sandbox']});
try {
  for(const {width,height} of [{width:1440,height:900},{width:1024,height:768},{width:1000,height:800},{width:768,height:1024},{width:390,height:844},{width:375,height:667},{width:320,height:568}]) {
    const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    // Simulate slow ImageKit access deterministically, without depending on
    // external network availability during final CI. Keep the exact requested
    // remote URLs in rendered CSS and preload attributes.
    const localFixtures=[
      'brand-pexels-sample.webp',
      'collection-pexels-sample.webp',
      'hero-pexels-sample.webp',
    ];
    await page.route('https://ik.imagekit.io/**',async route=>{
      const match=route.request().url().match(/home-page-(\d)\.webp/);
      const index=Number(match?.[1]??0)-1;
      if(index<0||index>2) return route.abort();
      if(index===0) await new Promise(resolve=>setTimeout(resolve,950));
      return route.fulfill({
        status:200,
        contentType:'image/webp',
        body:readFileSync('public/redcarpert/home/'+localFixtures[index]),
      });
    });
    await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
    const loader=page.locator('#redcarpert-page-loader');
    assert.equal(await loader.isVisible(),true,width+'px loader should cover delayed hero');
    assert.equal(await page.locator('#redcarpert-page-loader .rc-load-logo').isVisible(),true);
    assert.equal(await page.locator('#redcarpert-page-loader .rc-load-spinner').count(),1);
    const heroPreload=await page.locator('link[rel="preload"][as="image"]').getAttribute('href');
    assert.equal(heroPreload,'https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/home-page/home-page-1.webp?updatedAt=1794351596508');
    await loader.waitFor({state:'detached',timeout:11000});
    const appearance=await page.evaluate(()=>{
      const header=document.querySelector('#header');
      return {
        background:getComputedStyle(document.querySelector('.fullpage-wrapper > .section'),'::after').backgroundImage,
        softness:getComputedStyle(document.querySelector('.fullpage-wrapper > .section'),'::before').filter,
        softDisplay:getComputedStyle(document.querySelector('.fullpage-wrapper > .section'),'::before').display,
        heroLayers:getComputedStyle(document.querySelector('.fullpage-wrapper > .section'),'::after').backgroundImage,
        heroSize:getComputedStyle(document.querySelector('.fullpage-wrapper > .section'),'::after').backgroundSize,
        heroHeight:document.querySelector('.fullpage-wrapper > .section').getBoundingClientRect().height,
        headerPosition:getComputedStyle(header).position,
        headerHeight:header.getBoundingClientRect().height,
        headerBackground:getComputedStyle(header).backgroundColor,
        wrapperBackground:getComputedStyle(document.querySelector('.header-wrapper')).backgroundColor,
        wrapperPosition:getComputedStyle(document.querySelector('.header-wrapper')).position,
        wrapperPadding:parseFloat(getComputedStyle(document.querySelector('.header-wrapper')).paddingTop),
        contentWidth:document.documentElement.scrollWidth,
      };
    });
    assert(appearance.background.includes('ik.imagekit.io')&&appearance.background.includes('home-page-1.webp'));
    if(width<=640){
      assert.equal(appearance.softDisplay,'none',width+'px should display a single sharp image');
      assert.equal(appearance.softness,'none',width+'px should have no background blur');
      assert(!appearance.heroLayers.includes('linear-gradient('),
        width+'px should show the original photo without a colour overlay');
      assert.equal(appearance.heroSize,'cover',
        width+'px photo must cover viewport without blank bars');
    } else {
      assert(appearance.softness.includes('blur('),width+'px desktop background softness missing');
      assert(appearance.heroSize.includes('cover'),
        width+'px sharp photo should cover its live-proportioned centre on desktop/tablet');
    }
    assert(appearance.heroHeight>=height-2,width+'px initial image must fill the viewport height');
    assert.equal(appearance.headerPosition,'fixed',width+'px header must remain accessible while scrolling');
    const transparent = color => color === 'transparent' || /^rgba\([^)]*,\s*0(?:\.0+)?\)$/.test(color);
    const approvedTint = color => {
      const match = color.match(/^rgba\(0,\s*0,\s*0,\s*([\d.]+)\)$/);
      return !!match && Math.abs(Number(match[1])-.60)<.01;
    };
    assert(approvedTint(appearance.headerBackground),
      width+'px header must be dark and translucent (not solid black or clear): '+appearance.headerBackground);
    assert(transparent(appearance.wrapperBackground),width+'px wrapper must be transparent: '+appearance.wrapperBackground);
    assert.equal(appearance.wrapperPosition,'fixed',width+'px wrapper must not push photo downward');
    assert(appearance.wrapperPadding<=1,width+'px header wrapper must not reserve an opaque top strip');
    assert(appearance.contentWidth<=width+1.5,width+'px horizontal overflow');
    if(width<=768) {
      const mobileTheme=await page.evaluate(()=>{
        const present=document.body.classList.contains('mobile');
        document.body.classList.add('mobile');
        const header=getComputedStyle(document.querySelector('#header')).backgroundColor;
        const wrapper=getComputedStyle(document.querySelector('.header-wrapper'));
        const result={header,background:wrapper.backgroundColor,padding:parseFloat(wrapper.paddingTop)};
        if(!present)document.body.classList.remove('mobile');
        return result;
      });
      assert(approvedTint(mobileTheme.header)&&transparent(mobileTheme.background),
        width+'px inherited mobile class must preserve the approved translucent tint');
      assert(mobileTheme.padding<=1,width+'px inherited mobile class must not insert top spacing');
    }
    await page.evaluate(()=>scrollTo({top:Math.round(innerHeight*.6),behavior:'instant'}));
    await page.waitForTimeout(100);
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('fixed-header-scroll')),true);
    const compact = await page.evaluate(() => ({
      paddingTop:parseFloat(getComputedStyle(document.querySelector('#header')).paddingTop),
      logoMaxHeight:parseFloat(getComputedStyle(document.querySelector('#logo-container img')).maxHeight),
      headerBackground:getComputedStyle(document.querySelector('#header')).backgroundColor,
      wrapperBackground:getComputedStyle(document.querySelector('.header-wrapper')).backgroundColor,
    }));
    assert(approvedTint(compact.headerBackground),
      width+'px compact header must preserve the approved translucent tint');
    assert(transparent(compact.wrapperBackground),width+'px compact wrapper must remain transparent');
    assert(compact.paddingTop<=9,width+'px compact header must reduce vertical padding');
    assert(compact.logoMaxHeight<=(width<=1000?33:41),
      width+'px compact header logo must scale down: '+compact.logoMaxHeight);
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('redcarpert-header-tucked')),true,
      width+'px downward scroll must tuck compact header');
    await page.evaluate(()=>scrollTo({top:Math.round(innerHeight*.3),behavior:'instant'}));
    await page.waitForTimeout(100);
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('redcarpert-header-tucked')),false,
      width+'px scrolling up should reveal header');
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await page.waitForTimeout(100);
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('fixed-header-scroll')),false,
      width+'px initial header dimensions should restore at top');
    assert.deepEqual(errors,[],width+'px browser errors');
    console.log('Header + slow hero loader PASS',width,height);
    await page.close();
  }

  // The loader must apply to every editorial/catalogue route; never leave
  // a permanent overlay even when a request for remote imagery is aborted.
  const routes=['/product/','/our-brides/','/about-us/','/contact-us/','/digital-lookbook/'];
  for(const route of routes){
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await page.route('https://images.pexels.com/**',r=>r.abort());
    await page.goto(origin+route,{waitUntil:'domcontentloaded'});
    await page.locator('#redcarpert-page-loader').waitFor({state:'detached',timeout:11000});
    assert.equal(await page.locator('#header').isVisible(),true,route+' must remain usable');
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('redcarpert-home-native')),false);
    console.log('Site-wide loader PASS',route);
    await page.close();
  }
} finally {
  await browser.close();
}
