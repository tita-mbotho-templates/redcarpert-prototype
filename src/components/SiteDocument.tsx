import { createElement, type CSSProperties, type ReactNode } from "react";
import type { DocumentElement, DocumentNode, SiteDocumentData } from "@/types/site";
import { contentAdaptations } from "@/data/content-adaptations";
import { adaptSiteDocument } from "@/lib/content-adapter";
import { adaptHomepageBackgrounds } from "@/lib/homepage-backgrounds";
import { sitePages } from "@/data/site";
import { adaptNavigation } from "@/lib/navigation-adapter";
import { addHomepageFooter } from "@/lib/homepage-footer";
import { HomepageFooterScroll } from "./HomepageFooterScroll";
import { HeaderNavigationAlignment } from "./HeaderNavigationAlignment";
import { SiteRuntime } from "./SiteRuntime";

const attributeNames: Record<string, string> = {
  class: "className", for: "htmlFor", tabindex: "tabIndex", readonly: "readOnly",
  maxlength: "maxLength", minlength: "minLength", colspan: "colSpan", rowspan: "rowSpan",
  cellpadding: "cellPadding", cellspacing: "cellSpacing", frameborder: "frameBorder",
  allowfullscreen: "allowFullScreen", contenteditable: "contentEditable", autocomplete: "autoComplete",
  autofocus: "autoFocus", srcset: "srcSet", usemap: "useMap", datetime: "dateTime",
  crossorigin: "crossOrigin", fetchpriority: "fetchPriority", referrerpolicy: "referrerPolicy",
  "xlink:href": "xlinkHref", "xmlns:xlink": "xmlnsXlink", "xml:space": "xmlSpace",
};
const booleanAttributes = new Set(["disabled", "required", "multiple", "readOnly", "autoFocus", "hidden", "controls", "loop", "muted", "autoPlay", "playsInline", "open", "reversed", "allowFullScreen", "noValidate", "formNoValidate"]);
const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const tagNames: Record<string, string> = { lineargradient: "linearGradient", radialgradient: "radialGradient", clippath: "clipPath", textpath: "textPath", foreignobject: "foreignObject" };

function parseStyle(css: string): CSSProperties {
  const style: Record<string, string> = {};
  for (const declaration of css.split(/;(?![^()]*\))/)) {
    const separator = declaration.indexOf(":");
    if (separator < 0) continue;
    const name = declaration.slice(0, separator).trim();
    const property = name.startsWith("--") ? name : name.replace(/^-ms-/, "ms-").replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    if (property) style[property] = declaration.slice(separator + 1).replace(/\s*!important\s*$/, "").trim();
  }
  return style as CSSProperties;
}

function selectedValues(node: DocumentElement): string[] {
  return node.children.flatMap((child) => {
    if (typeof child === "string") return [];
    if (child.tag === "option" && "selected" in child.attrs) return [child.attrs.value ?? child.children.filter((item) => typeof item === "string").join("")];
    return selectedValues(child);
  });
}

function renderNode(node: DocumentNode, key: number): ReactNode {
  if (typeof node === "string") return node;
  if (["script", "noscript"].includes(node.tag)) return null;
  const props: Record<string, unknown> = { key };
  for (const [name, value] of Object.entries(node.attrs)) {
    // Keep the captured tree intact, but never expose its chat recipient/configuration.
    if (name === "data-settings" && node.attrs.class?.split(/\s+/).includes("ht_ctc_chat_data")) continue;
    if (/^on/i.test(name) || name === "selected") continue;
    if (name === "src" && !value) continue;
    const mapped = attributeNames[name] ?? (name.startsWith("data-") || name.startsWith("aria-") ? name : name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()));
    if (mapped === "style") props.style = parseStyle(value);
    else if (mapped === "value" && ["input", "select", "textarea"].includes(node.tag)) props.defaultValue = value;
    else if (mapped === "checked") props.defaultChecked = true;
    else props[mapped] = booleanAttributes.has(mapped) ? true : value;
  }
  if (node.tag === "select") {
    const values = selectedValues(node);
    if (values.length) props.defaultValue = "multiple" in node.attrs ? values : values[0];
  }
  if (node.tag === "textarea") {
    props.defaultValue = node.children.filter((child) => typeof child === "string").join("");
    return createElement(node.tag, props);
  }
  const tag = tagNames[node.tag] ?? node.tag;
  return voidTags.has(tag) ? createElement(tag, props) : createElement(tag, props, ...node.children.map(renderNode));
}

export function SemanticTree({ nodes }: { nodes: DocumentNode[] }) {
  return <>{nodes.map(renderNode)}</>;
}

export function SiteDocument({ document: original }: { document: SiteDocumentData }) {
  const document = adaptNavigation(addHomepageFooter(adaptHomepageBackgrounds(adaptSiteDocument(original, contentAdaptations)), sitePages["/about-us"]));
  return <>
    {document.styles.map((style, index) => style.href
      ? <link key={index} rel="stylesheet" href={style.href} media={style.media} />
      : <style key={index} dangerouslySetInnerHTML={{ __html: style.css ?? "" }} />)}
    <SemanticTree nodes={document.nodes} />
    <HeaderNavigationAlignment />
    {document.route === "/" && <HomepageFooterScroll />}
    <SiteRuntime document={{ bodyClass: document.bodyClass, htmlClass: document.htmlClass, scripts: document.scripts, themeConfig: document.themeConfig, postScripts: document.postScripts }} />
  </>;
}
