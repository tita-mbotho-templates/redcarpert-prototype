import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { REPOSITORY_BASE } from '../../src/config/site.ts';
const base = REPOSITORY_BASE;
// Rewrite known local URL namespaces only: a slash in JavaScript or SVG is not a path.
export const prefix = (s: string) => s
 .replace(/((?:href|action)=["'])\/(?=["'])/g, '$1'+base)
 .replace(/\/(?=(?:site-assets|redcarpert|seo|images|product(?:-category)?|digital-lookbook|our-brides|about-us|contact-us)(?:\/|["'?#]))/g,base);

export const assets = new Set<string>();
export function track(text: string) {
  for (const match of text.matchAll(/\/(?:site-assets|redcarpert|seo|images)\/[^\s"'<>),;&\\]+/g)) { const asset = match[0].split(/[?#]/)[0]; if (existsSync('public'+asset)) assets.add(asset); }
}

export async function copyTrackedAssets(root: string) {
for(const asset of assets) {
 let bytes;
 try {bytes = await readFile('public'+asset);} catch {throw new Error('Missing required asset: '+asset);}
 if(/\.(css|js|svg)$/.test(asset)) {
  let text = bytes.toString();
  if(asset.endsWith('.css')) text = text.replace(/url\(\s*["']?([^"')]+)["']?\s*\)/g, (full,url) => {
   if(/^(?:data:|https?:|\/\/|#)/.test(url)) return full;
   const resolved=path.posix.resolve(path.posix.dirname(asset),url).split(/[?#]/)[0];
   return existsSync('public'+resolved) ? full : 'none';
  });
  // Captured WordPress endpoints have no role in this static prototype.
  text = text.replace(/PEXETO\.ajaxurl="[^"]*";/g,'');
  for(const match of (asset.endsWith('.css') ? text : '').matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
   const url=match[1]; if(!/^(?:data:|https?:|\/\/|#)/.test(url)) { const resolved=path.posix.resolve(path.posix.dirname(asset),url).split(/[?#]/)[0]; assets.add(resolved); }
  }
  track(text); bytes=Buffer.from(prefix(text));
 }
 const target = path.join(root,'static',asset); await mkdir(path.dirname(target),{recursive:true}); await writeFile(target,bytes);
}
}
