/**
 * JSON Schema contract validation for EmbersCore API
 * Ensures runtime API shape matches expected contract
 */

/**
 * JSON Schema for the EmbersCore API contract
 */
export function getApiSchema() {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    required: ['exports', 'functions', 'types', 'constants'],
    properties: {
      exports: {
        type: 'array',
        items: { type: 'string' },
        minItems: 4,
        uniqueItems: true,
        contains: { const: 'SEMVER' }
      },
      functions: {
        type: 'object',
        required: ['verifyPayment', 'dedupe', 'isValidNetwork'],
        properties: {
          verifyPayment: {
            type: 'object',
            required: ['name', 'length', 'isAsync'],
            properties: {
              name: { const: 'verifyPayment' },
              length: { const: 5 },
              isAsync: { const: true }
            }
          },
          dedupe: {
            type: 'object',
            required: ['name', 'length', 'isAsync'],
            properties: {
              name: { const: 'dedupe' },
              length: { const: 1 },
              isAsync: { const: false }
            }
          },
          isValidNetwork: {
            type: 'object',
            required: ['name', 'length', 'isAsync'],
            properties: {
              name: { const: 'isValidNetwork' },
              length: { const: 1 },
              isAsync: { const: false }
            }
          }
        }
      },
      types: {
        type: 'object'
      },
      constants: {
        type: 'object',
        required: ['SEMVER'],
        properties: {
          SEMVER: {
            type: 'object',
            required: ['type', 'value'],
            properties: {
              type: { const: 'string' },
              value: { 
                type: 'string',
                pattern: '^\\d+\\.\\d+\\.\\d+$'
              }
            }
          }
        }
      }
    }
  };
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * Validates an API shape against the EmbersCore contract schema
 */
export function validateApiContract(apiShape: any): ValidationResult {
  const schema = getApiSchema();
  const errors: Array<{ path: string; message: string }> = [];
  
  // Basic validation implementation
  // In production, you would use a proper JSON Schema validator like ajv
  
  // Check required top-level properties
  const required = schema.required;
  for (const prop of required) {
    if (!(prop in apiShape)) {
      errors.push({
        path: `/${prop}`,
        message: `Missing required property: ${prop}`
      });
    }
  }
  
  // Validate exports array
  if (apiShape.exports) {
    const expectedExports = ['SEMVER', 'dedupe', 'isValidNetwork', 'verifyPayment'];
    for (const exp of expectedExports) {
      if (!apiShape.exports.includes(exp)) {
        errors.push({
          path: '/exports',
          message: `Missing required export: ${exp}`
        });
      }
    }
  }
  
  // Validate functions
  if (apiShape.functions) {
    // Check verifyPayment
    if (apiShape.functions.verifyPayment) {
      const vp = apiShape.functions.verifyPayment;
      if (vp.length !== 5) {
        errors.push({
          path: '/functions/verifyPayment/length',
          message: `Expected length 5, got ${vp.length}`
        });
      }
      if (vp.isAsync !== true) {
        errors.push({
          path: '/functions/verifyPayment/isAsync',
          message: `Expected isAsync true, got ${vp.isAsync}`
        });
      }
    } else {
      errors.push({
        path: '/functions/verifyPayment',
        message: 'Missing required function: verifyPayment'
      });
    }
    
    // Check dedupe
    if (apiShape.functions.dedupe) {
      const dd = apiShape.functions.dedupe;
      if (dd.length !== 1) {
        errors.push({
          path: '/functions/dedupe/length',
          message: `Expected length 1, got ${dd.length}`
        });
      }
      if (dd.isAsync !== false) {
        errors.push({
          path: '/functions/dedupe/isAsync',
          message: `Expected isAsync false, got ${dd.isAsync}`
        });
      }
    } else {
      errors.push({
        path: '/functions/dedupe',
        message: 'Missing required function: dedupe'
      });
    }
    
    // Check isValidNetwork
    if (apiShape.functions.isValidNetwork) {
      const ivn = apiShape.functions.isValidNetwork;
      if (ivn.length !== 1) {
        errors.push({
          path: '/functions/isValidNetwork/length',
          message: `Expected length 1, got ${ivn.length}`
        });
      }
      if (ivn.isAsync !== false) {
        errors.push({
          path: '/functions/isValidNetwork/isAsync',
          message: `Expected isAsync false, got ${ivn.isAsync}`
        });
      }
    } else {
      errors.push({
        path: '/functions/isValidNetwork',
        message: 'Missing required function: isValidNetwork'
      });
    }
  }
  
  // Validate constants
  if (apiShape.constants) {
    if (apiShape.constants.SEMVER) {
      const semver = apiShape.constants.SEMVER;
      if (semver.type !== 'string') {
        errors.push({
          path: '/constants/SEMVER/type',
          message: `Expected type string, got ${semver.type}`
        });
      }
      if (semver.value && !/^\d+\.\d+\.\d+$/.test(semver.value)) {
        errors.push({
          path: '/constants/SEMVER/value',
          message: `Invalid SEMVER format: ${semver.value}`
        });
      }
    } else {
      errors.push({
        path: '/constants/SEMVER',
        message: 'Missing required constant: SEMVER'
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}