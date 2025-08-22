/**
 * Utility for adding timeouts to network requests
 * Prevents hanging requests in unreliable network conditions
 */

/**
 * Wraps a promise with a timeout
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param endpoint - Optional endpoint URL for error context
 * @returns Promise that rejects if timeout is exceeded
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  endpoint?: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const errorMessage = `Request timeout after ${timeoutMs}ms`;
      const fullMessage = endpoint 
        ? `${errorMessage}. Endpoint: ${endpoint}`
        : errorMessage;
      reject(new Error(fullMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}