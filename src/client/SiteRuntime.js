import { installNavigation } from './navigation.js';
import { runtimeContent } from "../data/runtime";
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = window.document.createElement("script");
        script.src = src;
        script.async = false;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Could not load site interaction script: ${src}`));
        window.document.body.append(script);
    });
}
export function SiteRuntime({ document: data, }) {
    (() => {
        document.body.className = data.bodyClass;
        document.documentElement.className = data.htmlClass;
        let cancelled = false;
        const homepage = Boolean(document.querySelector('footer[data-homepage-footer]'));
        if (homepage) {
            document.body.classList.add('redcarpert-home-native');
            document.querySelector('.fullpage-wrapper')?.classList.remove('loading');
        }
        const grids = [...document.querySelectorAll(".woocommerce-ordering ~ ul.products")];
        const catalogItems = new Map(grids.map((grid) => [grid, [...grid.querySelectorAll(":scope > li.product")]]));
        const orderSelect = document.querySelector(".woocommerce-ordering select.orderby");
        const applyCatalogOrder = () => {
            const mode = orderSelect?.value || "menu_order";
            for (const [grid, initial] of catalogItems) {
                const items = [...initial];
                const number = (item, selector) => Number.parseFloat(item.querySelector(selector)?.textContent?.replace(/[^\d.]/g, "") || "0") || 0;
                if (mode === "date")
                    items.sort((a, b) => Number(b.className.match(/\bpost-(\d+)/)?.[1] || 0) - Number(a.className.match(/\bpost-(\d+)/)?.[1] || 0));
                if (mode === "price" || mode === "price-desc")
                    items.sort((a, b) => (number(a, ".price") - number(b, ".price")) * (mode === "price-desc" ? -1 : 1));
                if (mode === "rating")
                    items.sort((a, b) => number(b, ".star-rating") - number(a, ".star-rating"));
                const columns = Number(grid.className.match(/\bcolumns-(\d+)/)?.[1] || 4);
                items.forEach((item, index) => {
                    item.classList.toggle("first", index % columns === 0);
                    item.classList.toggle("last", index % columns === columns - 1);
                });
                grid.append(...items);
            }
            const url = new URL(location.href);
            if (mode === "menu_order")
                url.searchParams.delete("orderby");
            else
                url.searchParams.set("orderby", mode);
            history.replaceState(null, "", url);
        };
        const onCatalogChange = () => applyCatalogOrder();
        orderSelect?.addEventListener("change", onCatalogChange);
        const requestedOrder = new URLSearchParams(location.search).get("orderby");
        if (orderSelect && requestedOrder && [...orderSelect.options].some((option) => option.value === requestedOrder)) {
            orderSelect.value = requestedOrder;
            applyCatalogOrder();
        }
        const preventSubmission = (event) => {
            const form = event.target;
            if (!(form instanceof HTMLFormElement))
                return;
            event.preventDefault();
            event.stopImmediatePropagation();
            if (form.matches(".woocommerce-ordering")) {
                applyCatalogOrder();
                return;
            }
            let status = form.querySelector("[data-local-form-status]");
            if (!status) {
                status = document.createElement("p");
                status.dataset.localFormStatus = "true";
                status.setAttribute("role", "status");
                form.append(status);
            }
            status.textContent = runtimeContent.formSuccess;
        };
        const preventLegacySubmission = (event) => {
            const target = event.target;
            if (!(target instanceof Element))
                return;
            const button = target.closest(".pexeto-contact-form .send-button");
            const form = button?.closest("form");
            if (!(form instanceof HTMLFormElement))
                return;
            event.preventDefault();
            event.stopImmediatePropagation();
            if (form.reportValidity())
                form.requestSubmit();
        };
        document.addEventListener("submit", preventSubmission, true);
        document.addEventListener("click", preventLegacySubmission, true);
        void (async () => {
            for (const src of [...data.scripts, data.themeConfig, ...(data.postScripts ?? [])].filter(Boolean)) {
                if (cancelled)
                    return;
                if (src === data.themeConfig) {
                    installNavigation();
                    if (homepage) {
                        // Preserve native scrolling, but initialise the theme's regular
                        // sticky header/menu as on the other pages. No fullpage engine.
                        window.PEXETO?.init?.initSite();
                        window.PEXETO?.woocommerce?.init?.(true);
                        continue;
                    }
                }
                await loadScript(src);
            }
        })().catch((error) => console.error("Site interactions failed to initialize", error));
        return () => {
            cancelled = true;
            document.removeEventListener("submit", preventSubmission, true);
            document.removeEventListener("click", preventLegacySubmission, true);
            orderSelect?.removeEventListener("change", onCatalogChange);
        };
    })();
    return null;
}
