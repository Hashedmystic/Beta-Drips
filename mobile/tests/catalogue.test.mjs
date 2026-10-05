import test from 'node:test';
import assert from 'node:assert/strict';
import * as website from '../../src/data/catalogue.js';
import { brands, categories, products, formatPrice, productImageUrl, searchProducts } from '../lib/catalogue.mjs';

test('mobile uses the exact trusted website catalogue objects and associations', () => {
  assert.equal(products, website.products);
  assert.equal(brands, website.brands);
  assert.equal(categories, website.categories);
  assert.equal(formatPrice, website.formatPrice);
  assert.equal(products.length, 40);
  assert.equal(brands.length, 8);
  assert.equal(new Set(products.map(product => product.id)).size, 40);
  for (const product of products) {
    assert.equal(product.photo.id, product.id);
    assert.ok(product.sizes.length);
    assert.ok(product.price > 0);
    assert.equal(productImageUrl(product), `https://betadrips.netlify.app/images/catalogue/${product.id}.jpg`);
  }
});
test('brand and category filters combine without leaking unrelated products', () => {
  for (const brand of brands) {
    const items = searchProducts({ brandId: brand.id });
    assert.equal(items.length, 5);
    assert.ok(items.every(product => product.brandId === brand.id));
    const other = categories.find(category => category !== items[0].category);
    assert.equal(searchProducts({ brandId: brand.id, category: other }).length, 0);
  }
  for (const category of categories) {
    const items = searchProducts({ category });
    assert.equal(items.length, 5);
    assert.ok(items.every(product => product.category === category));
  }
});
test('search handles spaces/case, names, brands, categories and empty matches', () => {
  const product = products[0];
  assert.ok(searchProducts({ query: `  ${product.name.toUpperCase()}  ` }).includes(product));
  assert.ok(searchProducts({ query: product.brand }).includes(product));
  assert.ok(searchProducts({ query: product.category }).includes(product));
  assert.equal(searchProducts({ brandId: brands.find(brand => brand.id !== product.brandId).id, query: product.name }).length, 0);
  assert.equal(searchProducts({ query: 'no-such-piece-12345' }).length, 0);
  assert.equal(searchProducts({ query: '   ' }).length, 40);
  assert.equal(searchProducts().length, 40);
});
