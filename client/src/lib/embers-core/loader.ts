/**
 * EmbersCore loader snippet for parent inscriptions
 * Fetches and loads the latest child inscription containing the library
 * Enhanced with checksum verification, caching, retry logic, and version targeting
 */

interface EmbersCore {
  SEMVER: string;
  verifyPayment: (...args: unknown[]) => Promise<bigint>;
  dedupe: (txids: string[]) => string[];
  buildInfo?: {
    version: string;
    timestamp: string;
    gitHash: string;
  };
}

interface LoaderOptions {
  parentId?: string;
  parentIds?: string[];
  baseUrl?: string;
  onLoad?: (embersCore: EmbersCore) => void;
  
  // Checksum verification
  expectedHash?: string;
  verifyChecksum?: boolean;
  
  // Caching
  enableCache?: boolean;
  cacheTTL?: number; // milliseconds
  useFallback?: boolean;
  
  // Retry logic
  maxRetries?: number;
  retryDelay?: number; // milliseconds
  retryJitter?: boolean;
  
  // Version targeting
  target?: 'latest' | { height: number } | { id: string };
  
  // Concurrency
  maxConcurrency?: number;
}

interface CacheEntry {
  content: string;
  timestamp: number;
  height: number;
  isLastKnownGood?: boolean;
}

interface Child {
  id: string;
  height: number;
}

let loadingPromise: Promise<void> | null = null;

// Inscription ID validation regex
const INSCRIPTION_ID_REGEX = /^[a-f0-9]{64}i\d+$/;

/**
 * Validates inscription ID format
 */
function isValidInscriptionId(id: string): boolean {
  return INSCRIPTION_ID_REGEX.test(id);
}

/**
 * Computes SHA-256 hash of content
 */
async function computeHash(content: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('SubtleCrypto not available');
  }
  
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Gets cache key for a given parent and height
 */
function getCacheKey(parentId: string, height: number): string {
  return `embers-core:${parentId}:${height}`;
}

/**
 * Gets cached content if available and not expired
 */
function getCachedContent(
  parentId: string, 
  height: number, 
  ttl: number = 86400000 // 24 hours default
): CacheEntry | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  
  const key = getCacheKey(parentId, height);
  const cached = window.localStorage.getItem(key);
  
  if (!cached) {
    return null;
  }
  
  try {
    const entry: CacheEntry = JSON.parse(cached);
    const age = Date.now() - entry.timestamp;
    
    if (age > ttl) {
      // Expired
      window.localStorage.removeItem(key);
      return null;
    }
    
    return entry;
  } catch {
    return null;
  }
}

/**
 * Saves content to cache
 */
function setCachedContent(
  parentId: string,
  height: number,
  content: string,
  isLastKnownGood: boolean = false
): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  
  const key = getCacheKey(parentId, height);
  const entry: CacheEntry = {
    content,
    timestamp: Date.now(),
    height,
    isLastKnownGood
  };
  
  window.localStorage.setItem(key, JSON.stringify(entry));
  
  // Also save as last known good if specified
  if (isLastKnownGood) {
    const lastKnownKey = `embers-core:${parentId}:lastKnownGood`;
    window.localStorage.setItem(lastKnownKey, JSON.stringify(entry));
  }
}

/**
 * Gets last known good cached version
 */
function getLastKnownGood(parentId: string): CacheEntry | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  
  const key = `embers-core:${parentId}:lastKnownGood`;
  const cached = window.localStorage.getItem(key);
  
  if (!cached) {
    return null;
  }
  
  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

/**
 * Delays execution with optional jitter
 */
function delay(ms: number, jitter: boolean = false): Promise<void> {
  const actualDelay = jitter ? ms * (0.5 + Math.random()) : ms;
  return new Promise(resolve => setTimeout(resolve, actualDelay));
}

/**
 * Fetches with retry logic
 */
async function fetchWithRetry(
  url: string,
  maxRetries: number = 3,
  retryDelay: number = 1000,
  retryJitter: boolean = false
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const waitTime = retryDelay * Math.pow(2, attempt); // Exponential backoff
        await delay(waitTime, retryJitter);
      }
    }
  }
  
  throw new Error(`Failed to load after ${maxRetries} retries: ${lastError?.message}`);
}

/**
 * Loads the EmbersCore library with enhanced features
 */
export async function loadEmbersCore(options: LoaderOptions): Promise<void> {
  // Validate inputs
  if (options.parentId && !isValidInscriptionId(options.parentId)) {
    throw new Error('Invalid inscription ID format');
  }
  
  if (options.parentIds) {
    for (const id of options.parentIds) {
      if (!isValidInscriptionId(id)) {
        throw new Error('Invalid inscription ID format');
      }
    }
    
    // Handle parallel loading for multiple parents
    return loadMultipleParents(options);
  }
  
  const parentId = options.parentId;
  if (!parentId) {
    throw new Error('parentId is required');
  }
  
  // Prevent duplicate loading
  if (loadingPromise) {
    return loadingPromise;
  }
  
  // Check if already loaded
  if (typeof window !== 'undefined' && (window as any).EmbersCore) {
    if (options.onLoad) {
      options.onLoad((window as any).EmbersCore);
    }
    return;
  }
  
  loadingPromise = loadEmbersCoreInternal(parentId, options);
  
  try {
    await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

/**
 * Internal implementation of loader with all features
 */
async function loadEmbersCoreInternal(
  parentId: string,
  options: LoaderOptions
): Promise<void> {
  const {
    baseUrl = '',
    onLoad,
    expectedHash,
    verifyChecksum = false,
    enableCache = false,
    cacheTTL = 86400000, // 24 hours
    useFallback = false,
    maxRetries = 3,
    retryDelay = 1000,
    retryJitter = false,
    target = 'latest'
  } = options;
  
  try {
    let childId: string;
    let childHeight: number;
    let scriptContent: string;
    
    // Handle different target types
    if (typeof target === 'object' && 'id' in target) {
      // Load specific ID directly
      childId = target.id;
      childHeight = 0; // Unknown
      
      const contentUrl = `${baseUrl}/content/${childId}`;
      const response = await fetchWithRetry(contentUrl, maxRetries, retryDelay, retryJitter);
      scriptContent = await response.text();
      
    } else {
      // Fetch children metadata
      const childrenUrl = `${baseUrl}/r/children/${parentId}`;
      const childrenResponse = await fetchWithRetry(childrenUrl, maxRetries, retryDelay, retryJitter);
      const childrenData = await childrenResponse.json();
      const children: Child[] = childrenData.results || [];
      
      if (children.length === 0) {
        throw new Error(`No children found for parent inscription ${parentId}`);
      }
      
      // Select child based on target
      let selectedChild: Child | null = null;
      
      if (typeof target === 'object' && 'height' in target) {
        // Find child with specific height
        selectedChild = children.find(c => c.height === target.height) || null;
        if (!selectedChild) {
          throw new Error(`No child found with height ${target.height}`);
        }
      } else {
        // Find latest (highest height)
        selectedChild = children.reduce((latest, child) => {
          return !latest || child.height > latest.height ? child : latest;
        }, null as Child | null);
      }
      
      if (!selectedChild) {
        throw new Error('Could not determine target child');
      }
      
      childId = selectedChild.id;
      childHeight = selectedChild.height;
      
      // Check cache if enabled
      if (enableCache) {
        const cached = getCachedContent(parentId, childHeight, cacheTTL);
        if (cached) {
          scriptContent = cached.content;
        } else {
          // Fetch content
          const contentUrl = `${baseUrl}/content/${childId}`;
          const contentResponse = await fetchWithRetry(contentUrl, maxRetries, retryDelay, retryJitter);
          scriptContent = await contentResponse.text();
          
          // Cache it
          setCachedContent(parentId, childHeight, scriptContent, true);
        }
      } else {
        // Fetch content without caching
        const contentUrl = `${baseUrl}/content/${childId}`;
        const contentResponse = await fetchWithRetry(contentUrl, maxRetries, retryDelay, retryJitter);
        scriptContent = await contentResponse.text();
      }
    }
    
    // Verify checksum if requested
    if (verifyChecksum && expectedHash) {
      const actualHash = await computeHash(scriptContent);
      if (actualHash !== expectedHash) {
        throw new Error('Checksum verification failed');
      }
    }
    
    // Inject the script
    if (typeof document !== 'undefined') {
      const script = document.createElement('script');
      script.setAttribute('data-embers-core', 'true');
      script.setAttribute('data-inscription-id', childId);
      script.textContent = scriptContent;
      document.body.appendChild(script);
      
      // Call onLoad callback
      if (onLoad && (window as any).EmbersCore) {
        onLoad((window as any).EmbersCore);
      }
    }
    
  } catch (error) {
    // Try fallback if enabled
    if (useFallback && enableCache) {
      const fallback = getLastKnownGood(parentId);
      if (fallback) {
        console.warn('Loading failed, using cached fallback:', error);
        
        if (typeof document !== 'undefined') {
          const script = document.createElement('script');
          script.setAttribute('data-embers-core', 'true');
          script.setAttribute('data-embers-fallback', 'true');
          script.textContent = fallback.content;
          document.body.appendChild(script);
          
          if (onLoad && (window as any).EmbersCore) {
            onLoad((window as any).EmbersCore);
          }
        }
        return;
      }
    }
    
    console.error('Failed to load EmbersCore:', error);
    throw error;
  }
}

/**
 * Loads from multiple parents with bounded concurrency
 */
async function loadMultipleParents(options: LoaderOptions): Promise<void> {
  const {
    parentIds = [],
    maxConcurrency = 3,
    ...restOptions
  } = options;
  
  const queue = [...parentIds];
  const inProgress = new Set<Promise<void>>();
  const results: Array<{ parentId: string; success: boolean }> = [];
  
  while (queue.length > 0 || inProgress.size > 0) {
    // Start new loads up to concurrency limit
    while (queue.length > 0 && inProgress.size < maxConcurrency) {
      const parentId = queue.shift()!;
      const promise = loadEmbersCoreInternal(parentId, { ...restOptions, parentId })
        .then(() => {
          results.push({ parentId, success: true });
        })
        .catch(() => {
          results.push({ parentId, success: false });
        })
        .finally(() => {
          inProgress.delete(promise);
        });
      
      inProgress.add(promise);
    }
    
    // Wait for at least one to complete
    if (inProgress.size > 0) {
      await Promise.race(inProgress);
    }
  }
  
  // Check if any succeeded
  const anySuccess = results.some(r => r.success);
  if (!anySuccess) {
    throw new Error('Failed to load from any parent');
  }
}