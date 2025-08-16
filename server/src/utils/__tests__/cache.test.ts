import { SimpleCache } from '../cache';

describe('SimpleCache (C1.1 - RED)', () => {
  let cache: SimpleCache<string>;

  beforeEach(() => {
    cache = new SimpleCache<string>({ ttlMs: 1000 }); // 1 second TTL
  });

  afterEach(() => {
    cache.destroy();
  });

  it('stores and retrieves values within TTL', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
    expect(cache.has('key1')).toBe(true);
  });

  it('returns null for missing keys', () => {
    expect(cache.get('missing')).toBeNull();
    expect(cache.has('missing')).toBe(false);
  });

  it('expires values after TTL', async () => {
    const shortCache = new SimpleCache<string>({ ttlMs: 50 });
    
    shortCache.set('key1', 'value1');
    expect(shortCache.get('key1')).toBe('value1');
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(shortCache.get('key1')).toBeNull();
    expect(shortCache.has('key1')).toBe(false);
    
    shortCache.destroy();
  });

  it('supports delete and clear operations', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    
    expect(cache.size()).toBe(2);
    expect(cache.delete('key1')).toBe(true);
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBe('value2');
    
    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.get('key2')).toBeNull();
  });

  it('supports manual cleanup of expired entries', async () => {
    const shortCache = new SimpleCache<string>({ ttlMs: 50 });
    
    shortCache.set('key1', 'value1');
    shortCache.set('key2', 'value2');
    expect(shortCache.size()).toBe(2);
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Size still includes expired entries until cleanup
    expect(shortCache.size()).toBe(2);
    
    shortCache.cleanup();
    expect(shortCache.size()).toBe(0);
    
    shortCache.destroy();
  });

  it('supports automatic cleanup with timer', async () => {
    const autoCache = new SimpleCache<string>({ 
      ttlMs: 50, 
      cleanupIntervalMs: 75 
    });
    
    autoCache.set('key1', 'value1');
    expect(autoCache.size()).toBe(1);
    
    // Wait for expiration and cleanup
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(autoCache.size()).toBe(0);
    autoCache.destroy();
  });

  it('handles typed data correctly', () => {
    const numberCache = new SimpleCache<number>({ ttlMs: 1000 });
    const objectCache = new SimpleCache<{ foo: string }>({ ttlMs: 1000 });
    
    numberCache.set('num', 42);
    objectCache.set('obj', { foo: 'bar' });
    
    expect(numberCache.get('num')).toBe(42);
    expect(objectCache.get('obj')).toEqual({ foo: 'bar' });
    
    numberCache.destroy();
    objectCache.destroy();
  });
});
