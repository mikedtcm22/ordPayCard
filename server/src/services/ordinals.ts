/**
 * Ordinals API Client Service
 *
 * Provides a lightweight wrapper around fetch for interacting with ordinals APIs.
 * This service handles:
 * - Inscription data fetching
 * - Block height queries
 * - Retry logic with exponential backoff
 * - Request timeouts and error handling
 */

/**
 * Inscription data from ordinals API
 */
export interface InscriptionData {
  id: string;
  number: number;
  address: string;
  output_value: number;
  content_type: string;
  content_length: number;
  genesis_height: number;
  genesis_fee: number;
  sat: number;
  timestamp: number;
}

/**
 * Block height information
 */
export interface BlockHeight {
  height: number;
  hash: string;
  timestamp?: number;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T | undefined;
  error?: string | undefined;
  status?: number | undefined;
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  timeout: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  timeout: 5000, // 5 seconds
};

/**
 * Ordinals API Client
 */
export class OrdinalsApiClient {
  private baseUrl: string;
  private retryConfig: RetryConfig;

  constructor(baseUrl?: string, retryConfig?: Partial<RetryConfig>) {
    this.baseUrl = baseUrl || process.env['ORDINALS_API_URL'] || 'https://api.hiro.so';
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * Fetch inscription data by ID
   */
  async getInscription(inscriptionId: string): Promise<ApiResponse<InscriptionData>> {
    const url = `${this.baseUrl}/ordinals/v1/inscriptions/${inscriptionId}`;
    return this.fetchWithRetry<InscriptionData>(url);
  }

  /**
   * Fetch current block height
   */
  async getBlockHeight(): Promise<ApiResponse<BlockHeight>> {
    // Use a simple endpoint that returns block height
    // This might vary by API provider
    const url = `${this.baseUrl}/extended/v1/block/height`;
    return this.fetchWithRetry<BlockHeight>(url);
  }

  /**
   * Fetch with retry logic and timeout
   */
  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    attempt: number = 1,
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.retryConfig.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (attempt < this.retryConfig.maxRetries && this.shouldRetry(response.status)) {
          const delay = this.calculateDelay(attempt);
          await this.sleep(delay);
          return this.fetchWithRetry<T>(url, options, attempt + 1);
        }

        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data as T,
        status: response.status,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout',
          status: 408,
        };
      }

      if (attempt < this.retryConfig.maxRetries) {
        const delay = this.calculateDelay(attempt);
        await this.sleep(delay);
        return this.fetchWithRetry<T>(url, options, attempt + 1);
      }

      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check if we should retry based on status code
   */
  private shouldRetry(status: number): boolean {
    // Retry on server errors (5xx) and rate limiting (429)
    return status >= 500 || status === 429;
  }

  /**
   * Calculate delay for exponential backoff
   */
  private calculateDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test connection to the API
   */
  async testConnection(): Promise<ApiResponse<{ status: string }>> {
    try {
      const response = await this.getBlockHeight();
      if (response.success) {
        return {
          success: true,
          data: { status: 'connected' },
          status: 200,
        };
      }
      return {
        success: false,
        error: response.error || 'API call failed',
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

/**
 * Default ordinals API client instance
 */
let defaultClient: OrdinalsApiClient | null = null;

/**
 * Get or create default ordinals API client
 */
export function getOrdinalsClient(): OrdinalsApiClient {
  if (!defaultClient) {
    defaultClient = new OrdinalsApiClient();
  }
  return defaultClient;
}

/**
 * Convenience function to fetch inscription data
 */
export async function fetchInscription(
  inscriptionId: string,
): Promise<ApiResponse<InscriptionData>> {
  const client = getOrdinalsClient();
  return client.getInscription(inscriptionId);
}

/**
 * Convenience function to fetch block height
 */
export async function fetchBlockHeight(): Promise<ApiResponse<BlockHeight>> {
  const client = getOrdinalsClient();
  return client.getBlockHeight();
}

/**
 * Validate inscription ID format
 */
export function isValidInscriptionId(id: string): boolean {
  // Inscription IDs are typically transaction hash + index (e.g., "abc123...i0")
  // This is a basic format check - 64 hex chars + 'i' + number
  const inscriptionIdPattern = /^[a-f0-9]{64}i\d+$/i; // Case insensitive
  return inscriptionIdPattern.test(id);
}
