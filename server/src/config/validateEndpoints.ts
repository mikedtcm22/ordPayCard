/**
 * Validates endpoint configuration on server startup
 * Ensures all required endpoints are properly formatted URLs
 */

export interface EndpointConfig {
  ordinals_api_url?: string;
}

/**
 * Validates endpoint URLs in configuration
 * @param config - Configuration object containing endpoint URLs
 * @throws Error with actionable guidance if validation fails
 */
export function validateEndpoints(config: EndpointConfig): void {
  // Check for required endpoints - also catches empty strings
  if (!config.ordinals_api_url || config.ordinals_api_url.trim() === '') {
    throw new Error(
      'Missing required endpoint: ordinals_api_url. ' +
      'Set environment variable: ORDINALS_API_URL'
    );
  }

  // Validate URL format
  try {
    const url = new URL(config.ordinals_api_url);
    
    // Check for empty URLs that technically parse but are invalid
    if (!url.hostname || url.hostname === '') {
      throw new Error('Invalid hostname');
    }

    // Ensure protocol is http or https
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch (error) {
    throw new Error(
      `Invalid endpoint URL: ${config.ordinals_api_url}. ` +
      `Expected format: https://example.com`
    );
  }
}