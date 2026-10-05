// All chunks and the manifest remain encrypted by the native SecureStore adapter.
// Publish a new manifest only after every chunk was written successfully.
export function createSecureStorage(store, randomId) {
  const manifestKey = key => `${key}.manifest`;
  const chunkKey = (key, meta, i) => `${key}.${meta.id}.${i}`;
  async function metadata(key) {
    const raw = await store.getItemAsync(manifestKey(key));
    if (raw === null) return null;
    const meta = JSON.parse(raw);
    if (!/^[a-zA-Z0-9-]+$/.test(meta.id) || !Number.isInteger(meta.count) || meta.count < 1 || meta.count > 256) {
      throw new Error('Invalid secure storage manifest');
    }
    return meta;
  }
  async function cleanup(key, meta) {
    if (!meta) return;
    await Promise.allSettled(Array.from({ length: meta.count }, (_, i) => store.deleteItemAsync(chunkKey(key, meta, i))));
  }
  const operations = {
    async getItem(key) {
      const meta = await metadata(key);
      if (!meta) return null;
      const chunks = await Promise.all(Array.from({ length: meta.count }, (_, i) => store.getItemAsync(chunkKey(key, meta, i))));
      if (chunks.some(chunk => chunk === null)) throw new Error('Incomplete secure storage value');
      return decodeURIComponent(chunks.join(''));
    },
    async setItem(key, value) {
      const previous = await metadata(key);
      // ASCII encoding bounds each native value below historical 2 KiB limits.
      const encoded = encodeURIComponent(value);
      const chunks = encoded.match(/.{1,1200}/g) || [''];
      if (chunks.length > 256) throw new Error('Secure storage value too large');
      const meta = { id: randomId(), count: chunks.length };
      try {
        for (let i = 0; i < chunks.length; i++) await store.setItemAsync(chunkKey(key, meta, i), chunks[i]);
        await store.setItemAsync(manifestKey(key), JSON.stringify(meta));
      } catch (error) {
        await cleanup(key, meta);
        throw error;
      }
      await cleanup(key, previous);
    },
    async removeItem(key) {
      const meta = await metadata(key);
      await store.deleteItemAsync(manifestKey(key));
      await cleanup(key, meta);
    },
  };
  // Chunk reads must not race deletion of a previous generation during refresh.
  const queues = new Map();
  return Object.fromEntries(Object.keys(operations).map(name => [name, (key, ...args) => {
    const current = (queues.get(key) || Promise.resolve()).catch(() => {}).then(() => operations[name](key, ...args));
    queues.set(key, current);
    current.then(() => { if (queues.get(key) === current) queues.delete(key); }, () => { if (queues.get(key) === current) queues.delete(key); });
    return current;
  }]));
}
