import test from 'node:test';
import assert from 'node:assert/strict';
import { createNodeRenderer, escapeHtml } from '../scripts/lib/markup.ts';
import { prefix } from '../scripts/lib/assets.ts';
import { REPOSITORY_BASE } from '../src/config/site.ts';

test('serializer escapes text/attributes, excludes executable captures and preserves semantic markup', () => {
  const render = createNodeRenderer(['/', '/product']);
  assert.equal(escapeHtml('<" & >'), '&lt;&quot; &amp; &gt;');
  assert.equal(render('Hello <br> & friends'), 'Hello &lt;br&gt; &amp; friends');
  assert.equal(render({tag:'script',attrs:{src:'/old.js'},children:['alert(1)']}),'');
  assert.equal(render({tag:'noscript',attrs:{},children:['inactive']}),'');
  const node={tag:'a',attrs:{href:'/product',onclick:'evil()',title:'A & B'},children:['Dresses <3']};
  assert.equal(render(node),'<a href="/product/" title="A &amp; B">Dresses &lt;3</a>');
  assert.equal(node.attrs.href,'/product', 'the input is immutable');
  assert.equal(render({tag:'img',attrs:{src:'/redcarpert/x.webp',alt:'A < B'},children:[]}),'<img src="/redcarpert/x.webp" alt="A &lt; B">');
});

test('public-facing WhatsApp URLs become inert local preview controls', () => {
  const render=createNodeRenderer(['/']);
  const html=render({tag:'a',attrs:{href:'https://wa.me/123456789',target:'_blank',rel:'noopener'},children:['Enquire']});
  assert.doesNotMatch(html,/wa\.me|target=/);
  assert.match(html,/data-whatsapp-preview=""/);
  assert.match(html,/aria-haspopup="dialog"/);
  assert.match(html,/role="button"/);
});

test('repository URL prefix is stable and does not rewrite JavaScript slash operators', () => {
  assert.equal(REPOSITORY_BASE,'/redcarpert-prototype/');
  assert.equal(prefix('/product/'),'/redcarpert-prototype/product/');
  assert.equal(prefix('/site-assets/x.css'),'/redcarpert-prototype/site-assets/x.css');
  assert.equal(prefix('/redcarpert/gallery/a.webp'),'/redcarpert-prototype/redcarpert/gallery/a.webp');
  assert.equal(prefix('x / y'),'x / y');
  assert.equal(prefix('https://example.com/'),'https://example.com/');
});
