import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const base = 'http://localhost:4173/redcarpert-prototype';
const routes = ['/digital-lookbook/', '/about-us/', '/contact-us/'];
const viewports = [
  {width: 1440, height: 900},
  {width: 768, height: 900},
  {width: 390, height: 844},
  {width: 375, height: 667},
  {width: 320, height: 568},
];
const browser = await chromium.launch({args: ['--no-sandbox']});
try {
  for (const {width, height} of viewports) {
    for (const route of routes) {
      const page = await browser.newPage({viewport: {width, height}});
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      // CSS geometry is independent of provider availability or consent state.
      await page.route('https://www.google.com/maps/**', r => r.abort());
      await page.route('https://images.pexels.com/**', r => r.abort());
      await page.goto(base + route, {waitUntil: 'domcontentloaded'});
      const metrics = await page.evaluate(() => {
        const wrap = document.querySelector('.redcarpert-editorial');
        const title = document.querySelector('.redcarpert-editorial-page-title h1');
        const banner = document.querySelector('.redcarpert-editorial-page-title');
        const hero = wrap.querySelector('.redcarpert-editorial-hero');
        const panels = [...wrap.querySelectorAll('.redcarpert-editorial-panel')];
        const box = e => {
          const r = e.getBoundingClientRect();
          return {x:r.x, y:r.y, width:r.width, height:r.height, right:r.right, bottom:r.bottom, center:r.x+r.width/2};
        };
        const range = document.createRange();
        range.selectNodeContents(title);
        const titleText = range.getBoundingClientRect();
        const map = wrap.querySelector('.redcarpert-editorial-map');
        const team = wrap.querySelector('.redcarpert-editorial-team-grid');
        return {
          title: box(title),
          banner: box(banner),
          titleTextCenter: titleText.x + titleText.width / 2,
          hero: box(hero),
          root: box(wrap),
          panels: panels.map(box),
          h2Alignments: [...wrap.querySelectorAll('.redcarpert-editorial-hero h2, .redcarpert-editorial-panel h2')].map(h => getComputedStyle(h).textAlign),
          panelCount: panels.length,
          layoutClass: document.querySelector('#content-container')?.className,
          sidebar: Boolean(document.querySelector('#content-container #sidebar')),
          map: map ? box(map) : null,
          mapSrc: map?.querySelector('iframe')?.getAttribute('src') ?? null,
          mapLink: wrap.querySelector('a[href^="https://www.google.com/maps/search/"]')?.href ?? null,
          teamCount: team?.querySelectorAll('figure').length ?? 0,
          teamColumns: team ? getComputedStyle(team).gridTemplateColumns.split(' ').length : 0,
          teamLast: team ? box(team.lastElementChild) : null,
          teamSources: team ? [...team.querySelectorAll('img')].map(img => img.getAttribute('src')) : [],
          bookPages: wrap.querySelectorAll('#redcarpert-flipbook [data-book-page]').length,
          scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        };
      });
      assert.equal(metrics.layoutClass, 'content-boxed layout-full', width + 'px ' + route + ' layout must be full width');
      assert.equal(metrics.sidebar, false, width + 'px ' + route + ' should not have a sidebar');
      assert.equal(metrics.h2Alignments.every(a => a === 'center'), true, width + 'px ' + route + ' headings should be centred');
      assert(Math.abs(metrics.hero.center - metrics.root.center) <= 2, width + 'px ' + route + ' hero is off centre');
      assert(Math.abs(metrics.titleTextCenter - metrics.banner.center) <= 3, width + 'px ' + route + ' page title is off centre');
      for (const panel of metrics.panels) {
        assert(Math.abs(panel.center - metrics.root.center) <= 2, width + 'px ' + route + ' panel is off centre');
        assert(panel.width <= metrics.root.width + 1, width + 'px ' + route + ' panel exceeds root width');
      }
      if (route === '/about-us/') {
        assert.equal(metrics.teamCount, 3);
        assert(metrics.teamSources.every(s => s.startsWith('https://images.pexels.com/photos/')));
        assert(metrics.teamColumns >= 1 && metrics.teamColumns <= 3);
        if (metrics.teamColumns===2) {
          assert(Math.abs(metrics.teamLast.center - metrics.root.center)<=2,
            width + 'px the last team card must be centred on tablet');
        }
      } else if (route === '/contact-us/') {
        assert.equal(metrics.panelCount, 3);
        assert(metrics.map && metrics.map.width > 200, width + 'px map missing or collapsed');
        assert(Math.abs(metrics.map.center - metrics.root.center) <= 2, width + 'px map is not centred');
        assert(metrics.mapSrc.includes('Sunnyside%2C%20Pretoria%2C%20South%20Africa'));
        assert(metrics.mapLink.includes('Sunnyside'));
      } else {
        assert.equal(metrics.bookPages, 10, 'existing flippable book must remain intact');
      }
      assert(metrics.scrollWidth <= width+1.5, width + 'px ' + route + ' horizontal overflow: ' + metrics.scrollWidth);
      assert.deepEqual(errors, [], width + 'px ' + route + ' browser errors');
      console.log('Editorial layout PASS',width,route,'panels',metrics.panelCount,'map',Boolean(metrics.map));
      await page.close();
    }
  }
} finally {
  await browser.close();
}
