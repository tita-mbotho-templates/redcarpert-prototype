import { HeaderNavigationAlignment } from './HeaderNavigationAlignment.js';
import { FooterScrollToTop } from './FooterScrollToTop.js';
import { HomepageFooterScroll } from './HomepageFooterScroll.js';
import { SiteRuntime } from './SiteRuntime.js';
import { initializeEnquiryPreview } from './enquiry-preview.js';
import { initializeLookbookReader } from './lookbook-reader.js';
import { initializeCatalogueFilter } from './catalogue-filter.js';
import { initializeWeddingMomentsGallery } from './wedding-moments.js';
import { initializeFloatingWhatsApp } from './WhatsAppFloating.js';
import { initializePageLoader } from './PageLoader.js';
import { initializeHomepageHeaderScroll } from './HomepageHeaderScroll.js';

// The branded HTML loading screen is already visible before this module loads.
initializePageLoader();
const data = JSON.parse(document.getElementById('page-runtime').textContent);
// Static Pages HTML keeps a build-time year as a fallback, and the visitor's
// current year takes over on every page load (no annual deploy required).
const copyrightYear = document.querySelector('#footer[data-redcarpert-footer] [data-copyright-year]');
if (copyrightYear) copyrightYear.textContent = String(new Date().getFullYear());
// Update the collection label on the homepage using the visitor's local year.
// Recheck when a tab is revisited after New Year, without requiring a redeploy.
function syncCollectionYears() {
  const start = document.querySelector('.fullpage-wrapper [data-collection-year="start"]');
  const end = document.querySelector('.fullpage-wrapper [data-collection-year="end"]');
  if (!start || !end) return;
  const year = new Date().getFullYear();
  start.textContent = String(year);
  end.textContent = String(year + 1);
}
syncCollectionYears();
window.addEventListener('pageshow', syncCollectionYears);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) syncCollectionYears();
});
initializeEnquiryPreview();
initializeLookbookReader(import.meta.env.BASE_URL);
initializeCatalogueFilter();
initializeWeddingMomentsGallery();
initializeFloatingWhatsApp();
HeaderNavigationAlignment();
if (document.querySelector('footer[data-homepage-footer]')) HomepageFooterScroll(); else FooterScrollToTop();
SiteRuntime({document:data});
initializeHomepageHeaderScroll();
