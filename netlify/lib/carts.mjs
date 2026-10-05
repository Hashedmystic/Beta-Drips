import { createHash } from 'node:crypto';
import { products } from '../../src/data/catalogue.js';
export function prepareCart(body) {
  if (!body || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.operationId)
    || !['replace', 'merge'].includes(body.mode) || !Number.isSafeInteger(body.revision) || body.revision < 0
    || !Array.isArray(body.items) || body.items.length > 100) throw new Error('Invalid cart operation.');
  const items = body.items.map(item => {
    const product = products.find(product => product.id === item?.productId);
    if (!product?.sizes.includes(item.size) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)
      throw new Error('Invalid product, size or quantity.');
    return { productId: product.id, size: item.size, quantity: item.quantity };
  }).sort((a, b) => a.productId.localeCompare(b.productId) || a.size.localeCompare(b.size));
  if (new Set(items.map(item => JSON.stringify([item.productId, item.size]))).size !== items.length)
    throw new Error('Duplicate cart lines.');
  return { items, hash: createHash('sha256').update(JSON.stringify({ mode: body.mode, revision: body.revision, items })).digest('hex') };
}
