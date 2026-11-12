import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const [baselineDir, candidateDir] = process.argv.slice(2);
if (!baselineDir || !candidateDir) throw new Error('Usage: node scripts/compare-page-html.mjs baseline/dist dist');

const htmlFiles = (root, prefix = '') => readdirSync(path.join(root,prefix), {withFileTypes:true}).flatMap(entry => {
 const p = path.join(prefix,entry.name);
 return entry.isDirectory()?htmlFiles(root,p):p.endsWith('.html')?[p.replaceAll('\\','/')]:[];
}).sort();
const baseline = htmlFiles(baselineDir);
const candidate = htmlFiles(candidateDir);
assert.deepEqual(candidate,baseline,'The approved page set or 404 changed');
const normalize = html => html.replace(/\/redcarpert-prototype\/assets\/main-[A-Za-z0-9_-]+\.js/g, '/redcarpert-prototype/assets/main-[BUNDLE].js');
for (const file of baseline) {
 const before=normalize(readFileSync(path.join(baselineDir,file),'utf8'));
 const after=normalize(readFileSync(path.join(candidateDir,file),'utf8'));
 assert.equal(after,before,`HTML or style markup drift: ${file}`);
}
const pdf='digital-lookbook/Redcarpert-Sample-Lookbook.pdf';
assert.deepEqual(readFileSync(path.join(candidateDir,pdf)),readFileSync(path.join(baselineDir,pdf)),'PDF changed');
console.log(`Approved HTML parity passed: ${baseline.length} documents and unchanged PDF`);
