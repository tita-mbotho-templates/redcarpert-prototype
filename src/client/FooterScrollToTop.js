/** The old scrollTo plugin selects body for WebKit, which is not the standards-mode scroller. */
export function FooterScrollToTop() {
    (() => {
        const control = document.querySelector("footer:not([data-homepage-footer]) > .scroll-to-top");
        if (!control)
            return;
        let frame = 0;
        const scroll = () => {
            cancelAnimationFrame(frame);
            const start = window.scrollY;
            const started = performance.now();
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const step = (now) => {
                const progress = reduced ? 1 : Math.min(1, (now - started) / 1000);
                window.scrollTo({ top: progress === 1 ? 0 : start * (1 - Math.sin(progress * Math.PI / 2)), behavior: "instant" });
                if (progress < 1)
                    frame = requestAnimationFrame(step);
                else
                    document.body.dispatchEvent(new Event("mousewheel", { bubbles: true }));
            };
            frame = requestAnimationFrame(step);
        };
        const click = (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            scroll();
        };
        const keydown = (event) => {
            if (event.key !== "Enter" && event.key !== " ")
                return;
            event.preventDefault();
            event.stopImmediatePropagation();
            if (!event.repeat)
                control.click();
        };
        control.addEventListener("click", click, true);
        control.addEventListener("keydown", keydown);
        return () => {
            cancelAnimationFrame(frame);
            control.removeEventListener("click", click, true);
            control.removeEventListener("keydown", keydown);
        };
    })();
    return null;
}
