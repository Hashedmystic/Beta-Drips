export function validPublicConfig(url, key) {
  // Require the publishable format; never accept a service-role JWT or secret key.
  if (typeof key !== 'string' || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key) || /YOUR_/i.test(key)) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password && !parsed.search && !parsed.hash && !/YOUR_/i.test(url);
  } catch { return false; }
}
