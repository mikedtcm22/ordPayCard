/**
 * Embers-core loader with multi-source fallback mechanism
 * Attempts to load from: inscription -> CDN -> local bundle
 */

export enum LoaderSource {
  INSCRIPTION = 'inscription',
  CDN = 'cdn',
  LOCAL = 'local'
}

export interface LoaderConfig {
  inscriptionId: string;
  cdnUrl: string;
  localPath: string;
  timeout?: number;
}

export interface LoadResult {
  source: LoaderSource;
  content: string;
  errors: LoaderError[];
}

export class LoaderError extends Error {
  source?: LoaderSource;
  url?: string;
  hint?: string;
  errors?: LoaderError[];
  
  constructor(message: string, options?: {
    source?: LoaderSource;
    url?: string;
    hint?: string;
    errors?: LoaderError[];
  }) {
    super(message);
    this.name = 'LoaderError';
    this.source = options?.source;
    this.url = options?.url;
    this.hint = options?.hint;
    this.errors = options?.errors;
  }
}

export class EmbersLoader {
  private config: LoaderConfig;
  
  constructor(config: LoaderConfig) {
    // Validate configuration
    if (!config.inscriptionId || config.inscriptionId.trim() === '') {
      throw new Error('Invalid inscription ID');
    }
    
    try {
      new URL(config.cdnUrl);
    } catch {
      throw new Error('Invalid CDN URL');
    }
    
    this.config = {
      ...config,
      timeout: config.timeout || 5000
    };
  }
  
  /**
   * Load embers-core with multi-source fallback
   * @returns LoadResult with content and any errors encountered
   * @throws LoaderError if all sources fail
   */
  async load(): Promise<LoadResult> {
    const errors: LoaderError[] = [];
    
    // Try inscription source
    const inscriptionUrl = this.getInscriptionUrl();
    try {
      const content = await this.fetchWithTimeout(
        inscriptionUrl,
        LoaderSource.INSCRIPTION
      );
      return {
        source: LoaderSource.INSCRIPTION,
        content,
        errors: []
      };
    } catch (error) {
      const inscriptionError = new LoaderError(
        `Failed to load from inscription ${this.config.inscriptionId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          source: LoaderSource.INSCRIPTION,
          url: inscriptionUrl,
          hint: 'Please check ord sync status or use fallback'
        }
      );
      errors.push(inscriptionError);
    }
    
    // Try CDN fallback
    try {
      const content = await this.fetchWithTimeout(
        this.config.cdnUrl,
        LoaderSource.CDN
      );
      return {
        source: LoaderSource.CDN,
        content,
        errors
      };
    } catch (error) {
      const cdnError = new LoaderError(
        `Failed to load from CDN: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          source: LoaderSource.CDN,
          url: this.config.cdnUrl,
          hint: 'CDN may be unavailable'
        }
      );
      errors.push(cdnError);
    }
    
    // Try local bundle fallback
    try {
      const content = await this.fetchWithTimeout(
        this.config.localPath,
        LoaderSource.LOCAL
      );
      return {
        source: LoaderSource.LOCAL,
        content,
        errors
      };
    } catch (error) {
      const localError = new LoaderError(
        `Failed to load from local: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          source: LoaderSource.LOCAL,
          url: this.config.localPath,
          hint: 'Local bundle may not be available'
        }
      );
      errors.push(localError);
    }
    
    // All sources failed
    throw new LoaderError(
      'Failed to load embers-core from all sources',
      {
        errors,
        hint: 'All fallback sources failed. Please check network connectivity and configuration.'
      }
    );
  }
  
  /**
   * Fetch content with timeout
   * @param url URL to fetch from
   * @param source Source identifier for error reporting
   * @returns Content as string
   * @throws Error on fetch failure or timeout
   */
  private async fetchWithTimeout(url: string, source: LoaderSource): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    
    try {
      const response = await fetch(url, { signal: controller.signal });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const content = await response.text();
      return content;
    } catch (error) {
      // Convert AbortError to a more descriptive timeout error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${this.config.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  /**
   * Get inscription URL from inscription ID
   * @returns Full URL to fetch inscription content
   */
  private getInscriptionUrl(): string {
    // This would normally construct the proper ordinals API URL
    // For now, using a simple pattern
    return `https://ordinals.com/content/${this.config.inscriptionId}`;
  }
}