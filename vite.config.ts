import { defineConfig, type ViteDevServer, type PreviewServer } from 'vite';
import { REPOSITORY_BASE } from './src/config/site';
import { localRequestPath } from './scripts/lib/request-url';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
const projectRoot = REPOSITORY_BASE.slice(0, -1);
const routes: string[] = JSON.parse(readFileSync('.generated/routes.json','utf8'));
function fallback(server: ViteDevServer | PreviewServer) {
 return () => server.middlewares.use((req,res,next) => {
  const url = localRequestPath(req.url);
  if (url === null) { res.statusCode = 400; res.end('Malformed request path'); return; }
  if (routes.includes(url) && url !== '/') { res.statusCode=301; res.setHeader('Location',projectRoot+url+'/'); res.end(); return; }
  if (url === '/' || url.startsWith('/src/') || url.startsWith('/@') || ['dist','.generated'].some(dir => existsSync(path.join(dir,url)))) return next();
  res.statusCode = 404;
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.end(readFileSync('.generated/404.html'));
 });
}
export default defineConfig({
 plugins: [{name:'repository-base',transformIndexHtml:{order:'post',handler:html=>html.replaceAll(REPOSITORY_BASE + REPOSITORY_BASE.slice(1), REPOSITORY_BASE)}}, {name:'static-404',configureServer:fallback,configurePreviewServer:fallback}],
 root: '.generated',
 base: REPOSITORY_BASE,
 publicDir: 'static',
 appType: 'mpa',
 resolve: {alias: {'/src': path.resolve('src')}},
 server: {fs: {allow: [process.cwd()]}},
 build: {outDir: '../dist',emptyOutDir:true,rollupOptions:{input:[...routes.map(route=>path.resolve('.generated',route.slice(1),'index.html')),path.resolve('.generated/404.html')]}},
});
