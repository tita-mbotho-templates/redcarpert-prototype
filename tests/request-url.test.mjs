import test from 'node:test';
import assert from 'node:assert/strict';
import { localRequestPath } from '../scripts/lib/request-url.ts';

test('Vite URLs preserve approved base paths and query-independent matching', () => {
  assert.equal(localRequestPath('/redcarpert-prototype/'),'/');
  assert.equal(localRequestPath('/redcarpert-prototype/digital-lookbook/'),'/digital-lookbook/');
  assert.equal(localRequestPath('/redcarpert-prototype/product?orderby=date'),'/product');
  assert.equal(localRequestPath('/@vite/client'),'/@vite/client');
  assert.equal(localRequestPath('/redcarpert-prototype2/'),'/redcarpert-prototype2/');
});

test('malformed and traversal requests fail closed without throwing', () => {
  for (const value of ['/%','/%ZZ','/%E0%A4%A','/redcarpert-prototype/%2E%2E/private','/redcarpert-prototype/../secret','/redcarpert-prototype/%00','/redcarpert-prototype/%5Cetc']) {
    assert.equal(localRequestPath(value),null,value);
  }
});
