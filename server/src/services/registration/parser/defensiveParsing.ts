/**
 * Defensive parsing utilities with typed errors and timeout protection
 *
 * Provides bounds checking, input validation, and timeout wrappers to protect
 * the parser against malicious or oversized inputs that could cause DoS.
 */

/**
 * Typed error hierarchy for parser failures
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ParserError {
  export class InvalidInput extends Error {
    public override readonly name = 'ParserError.InvalidInput';
    public readonly code = 'INVALID_INPUT';
    
    constructor(message: string) {
      super(message);
    }
  }

  export class BoundsExceeded extends Error {
    public override readonly name = 'ParserError.BoundsExceeded';
    public readonly code = 'BOUNDS_EXCEEDED';
    
    constructor(message: string, public readonly details: { limit: number; actual: number }) {
      super(message);
    }
  }

  export class Timeout extends Error {
    public override readonly name = 'ParserError.Timeout';
    public readonly code = 'TIMEOUT';
    
    constructor(message: string, public readonly details: { timeoutMs: number }) {
      super(message);
    }
  }
}

/**
 * Wrap a promise with a timeout; throws ParserError.Timeout if exceeded.
 * Used to prevent parser from hanging on slow network operations.
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      reject(new ParserError.Timeout('Operation timed out', { timeoutMs }));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutHandle);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutHandle);
        reject(error);
      });
  });
}

/**
 * Validate hex string length and format; throws on invalid input or bounds exceeded.
 * Protects against oversized transaction hex strings.
 */
export function validateHexBounds(hex: string, maxLength: number): void {
  if (typeof hex !== 'string') {
    throw new ParserError.InvalidInput('Input must be a string');
  }

  if (!/^[0-9a-fA-F]*$/.test(hex)) {
    throw new ParserError.InvalidInput('Input contains non-hex characters');
  }

  if (hex.length > maxLength) {
    throw new ParserError.BoundsExceeded('Hex input exceeds maximum length', {
      limit: maxLength,
      actual: hex.length,
    });
  }
}

/**
 * Validate ASCII string length and character set; throws on invalid input or bounds exceeded.
 * Protects against oversized OP_RETURN payloads.
 */
export function validateAsciiLength(text: string, maxLength: number): void {
  if (typeof text !== 'string') {
    throw new ParserError.InvalidInput('Input must be a string');
  }

  // Check for non-ASCII characters (code points > 127)
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 127) {
      throw new ParserError.InvalidInput('Input contains non-ASCII characters');
    }
  }

  if (text.length > maxLength) {
    throw new ParserError.BoundsExceeded('ASCII input exceeds maximum length', {
      limit: maxLength,
      actual: text.length,
    });
  }
}

