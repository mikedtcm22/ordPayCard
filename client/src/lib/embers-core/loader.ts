/**
 * EmbersCore loader snippet for parent inscriptions
 * Fetches and loads the latest child inscription containing the library
 */

interface EmbersCore {
  SEMVER: string;
  verifyPayment: (...args: unknown[]) => Promise<bigint>;
  dedupe: (txids: string[]) => string[];
}

interface LoaderOptions {
  parentId: string;
  baseUrl?: string;
  onLoad?: (embersCore: EmbersCore) => void;
}

let loadingPromise: Promise<void> | null = null;

/**
 * Loads the latest EmbersCore library from child inscriptions
 * @param options - Configuration for loading the library
 */
export async function loadEmbersCore(options: LoaderOptions): Promise<void> {
  const { parentId, baseUrl = '', onLoad } = options;
  
  // Prevent duplicate loading
  if (loadingPromise) {
    return loadingPromise;
  }
  
  // Check if already loaded
  if (typeof window !== 'undefined' && (window as Window & { EmbersCore?: EmbersCore }).EmbersCore) {
    if (onLoad) {
      onLoad((window as Window & { EmbersCore: EmbersCore }).EmbersCore);
    }
    return;
  }
  
  loadingPromise = loadEmbersCoreInternal(parentId, baseUrl, onLoad);
  
  try {
    await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

async function loadEmbersCoreInternal(
  parentId: string,
  baseUrl: string,
  onLoad?: (embersCore: EmbersCore) => void
): Promise<void> {
  try {
    // Fetch children of the parent inscription
    const childrenUrl = `${baseUrl}/r/children/${parentId}`;
    const childrenResponse = await fetch(childrenUrl);
    
    if (!childrenResponse.ok) {
      throw new Error(`Failed to fetch children: ${childrenResponse.status}`);
    }
    
    const childrenData = await childrenResponse.json();
    const children = childrenData.results || [];
    
    if (children.length === 0) {
      console.warn(`No children found for parent inscription ${parentId}`);
      return;
    }
    
    // Find the latest child by height
    interface Child {
      id: string;
      height: number;
    }
    const latestChild = children.reduce((latest: Child | null, child: Child) => {
      if (!latest || child.height > latest.height) {
        return child;
      }
      return latest;
    }, null as Child | null);
    
    if (!latestChild) {
      console.warn('Could not determine latest child');
      return;
    }
    
    // Fetch the content of the latest child
    const contentUrl = `${baseUrl}/content/${latestChild.id}`;
    const contentResponse = await fetch(contentUrl);
    
    if (!contentResponse.ok) {
      throw new Error(`Failed to fetch child content: ${contentResponse.status}`);
    }
    
    const scriptContent = await contentResponse.text();
    
    // Inject the script into the page
    if (typeof document !== 'undefined') {
      const script = document.createElement('script');
      script.setAttribute('data-embers-core', 'true');
      script.textContent = scriptContent;
      document.body.appendChild(script);
      
      // Call onLoad callback if provided
      if (onLoad && (window as Window & { EmbersCore?: EmbersCore }).EmbersCore) {
        onLoad((window as Window & { EmbersCore: EmbersCore }).EmbersCore);
      }
    }
  } catch (error) {
    console.error('Failed to load EmbersCore:', error);
  }
}