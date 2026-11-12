import { homepageBackgrounds } from "./homepage-backgrounds";

/** Small, critical and self-contained. Renders before the rest of the page. */
export const pageLoaderCss = `
#redcarpert-page-loader {
  position:fixed;inset:0;z-index:999999;
  display:flex;align-items:center;justify-content:center;
  min-height:100vh;min-height:100svh;
  padding:24px;box-sizing:border-box;
  background:#1d1b1b;color:#eee6dc;
  text-align:center;opacity:1;visibility:visible;
  transition:opacity .34s ease,visibility .34s ease;
}
#redcarpert-page-loader[data-state="exiting"] {
  opacity:0;visibility:hidden;pointer-events:none;
}
#redcarpert-page-loader .rc-load-inner {
  display:flex;flex-direction:column;align-items:center;
  gap:18px;width:100%;max-width:380px;
}
#redcarpert-page-loader .rc-load-logo {
  display:block;width:min(76vw,290px);height:auto;
  object-fit:contain;
}
#redcarpert-page-loader .rc-load-line {
  width:76px;height:1px;background:rgba(185,149,100,.65);
}
#redcarpert-page-loader .rc-load-spinner {
  box-sizing:border-box;width:25px;height:25px;
  border:2px solid rgba(185,149,100,.18);
  border-top-color:#b99564;border-radius:50%;
  animation:rc-loading-spin .85s linear infinite;
}
#redcarpert-page-loader .rc-load-caption {
  margin:0;font:400 11px/1.7 Arial,sans-serif;
  letter-spacing:.09em;color:#c8b9a7;
}
@keyframes rc-loading-spin {to{transform:rotate(360deg)}}
@media print {#redcarpert-page-loader{display:none!important}}
@media(prefers-reduced-motion:reduce) {
  #redcarpert-page-loader,.rc-load-spinner{transition:none!important;animation:none!important}
  #redcarpert-page-loader .rc-load-spinner{border-color:#b99564}
}
`;

/** Same approved logo, resized at build-time; never introduce replacement art. */
export function pageLoaderMarkup(home: boolean): string {
  const hero = home ? ` data-hero-url="${homepageBackgrounds[0].replacement}"` : "";
  return `<div id="redcarpert-page-loader" role="status" aria-live="polite" aria-label="Loading Redcarpert Wedding Dresses"${hero}><div class="rc-load-inner"><img class="rc-load-logo" src="/redcarpert/brand/redcarpert-logo-optimized.webp" alt="Redcarpert Wedding Dresses" width="640" height="236" decoding="async"><span class="rc-load-line" aria-hidden="true"></span><span class="rc-load-spinner" aria-hidden="true"></span><p class="rc-load-caption">Preparing your bridal experience</p></div></div>`;
}

/** Fail open: JS errors or unavailable images must never lock the site. */
export const pageLoaderFallback = `<script>window.__redcarpertLoaderFallback=setTimeout(function(){var el=document.getElementById("redcarpert-page-loader");if(el){el.dataset.state="exiting";setTimeout(function(){el.remove()},400)}},8000)</script>`;
