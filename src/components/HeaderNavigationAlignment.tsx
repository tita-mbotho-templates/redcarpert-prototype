"use client";

import { useEffect } from "react";

/**
 * Align the approved, longer navigation alongside the unmodified logo.
 * The original floating layout and every theme CSS rule remain in control
 * of widths, wrapping and header height.
 */
export function HeaderNavigationAlignment() {
  useEffect(() => {
    const logo = document.querySelector<HTMLElement>("#header #logo-container");
    const navigation = document.querySelector<HTMLElement>("#header .navigation-container");
    if (!logo || !navigation) return;

    let frame = 0;
    const align = () => {
      // Measure natural source geometry, not a previously translated box.
      navigation.style.removeProperty("translate");
      if (document.body.classList.contains("fixed-header-scroll")
        || window.innerWidth <= 1000
        || getComputedStyle(navigation).display === "none") return;

      const image = logo.getBoundingClientRect();
      const menu = navigation.getBoundingClientRect();
      // The original layout naturally wraps navigation below the logo around
      // 1001-1024px. Never move that lower row or the mobile menu.
      const besideLogo = menu.left >= image.right + 8
        && menu.top < image.bottom - 2
        && menu.width > 0 && image.height > 0;
      if (!besideLogo) return;

      // Translation changes only visual alignment, not layout flow or height.
      const offset = Math.round(image.top + image.height / 2 - menu.top - menu.height / 2);
      navigation.style.translate = `0 ${offset}px`;
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(align);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(logo);
    resize.observe(navigation);
    const bodyClass = new MutationObserver(schedule);
    bodyClass.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", schedule);
    window.addEventListener("load", schedule);
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      bodyClass.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("load", schedule);
      navigation.style.removeProperty("translate");
    };
  }, []);
  return null;
}
