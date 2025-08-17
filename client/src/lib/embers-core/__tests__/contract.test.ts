/**
 * JSON Schema-based contract tests for EmbersCore API
 * Validates runtime API shape matches expected contract
 */

import { describe, it, expect } from 'vitest';
import * as EmbersCore from '../index';
import { validateApiContract, getApiSchema } from '../contract';

describe('API Contract Validation', () => {
  it('should validate EmbersCore exports against JSON schema', () => {
    const apiShape = {
      exports: Object.keys(EmbersCore).sort(),
      functions: {},
      types: {},
      constants: {}
    };

    // Analyze each export
    for (const [key, value] of Object.entries(EmbersCore)) {
      if (typeof value === 'function') {
        apiShape.functions[key] = {
          name: key,
          length: value.length,
          isAsync: value.constructor.name === 'AsyncFunction'
        };
      } else if (typeof value === 'string' || typeof value === 'number') {
        apiShape.constants[key] = {
          type: typeof value,
          value: value
        };
      }
    }

    // Validate against schema
    const validation = validateApiContract(apiShape);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it('should define expected function signatures in schema', () => {
    const schema = getApiSchema();
    
    // Check verifyPayment schema
    expect(schema.properties.functions.properties.verifyPayment).toEqual({
      type: 'object',
      required: ['name', 'length', 'isAsync'],
      properties: {
        name: { const: 'verifyPayment' },
        length: { const: 5 },
        isAsync: { const: true }
      }
    });

    // Check dedupe schema
    expect(schema.properties.functions.properties.dedupe).toEqual({
      type: 'object',
      required: ['name', 'length', 'isAsync'],
      properties: {
        name: { const: 'dedupe' },
        length: { const: 1 },
        isAsync: { const: false }
      }
    });

    // Check isValidNetwork schema
    expect(schema.properties.functions.properties.isValidNetwork).toEqual({
      type: 'object',
      required: ['name', 'length', 'isAsync'],
      properties: {
        name: { const: 'isValidNetwork' },
        length: { const: 1 },
        isAsync: { const: false }
      }
    });
  });

  it('should define expected constants in schema', () => {
    const schema = getApiSchema();
    
    expect(schema.properties.constants.properties.SEMVER).toEqual({
      type: 'object',
      required: ['type', 'value'],
      properties: {
        type: { const: 'string' },
        value: { 
          type: 'string',
          pattern: '^\\d+\\.\\d+\\.\\d+$'
        }
      }
    });
  });

  it('should detect contract violations', () => {
    const invalidApiShape = {
      exports: ['SEMVER', 'dedupe'], // Missing exports
      functions: {
        dedupe: {
          name: 'dedupe',
          length: 2, // Wrong arity
          isAsync: false
        }
      },
      types: {},
      constants: {
        SEMVER: {
          type: 'number', // Wrong type
          value: 123
        }
      }
    };

    const validation = validateApiContract(invalidApiShape);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.errors).toContainEqual(
      expect.objectContaining({
        path: expect.any(String),
        message: expect.any(String)
      })
    );
  });

  it('should export getApiSchema function', () => {
    const schema = getApiSchema();
    
    expect(schema).toHaveProperty('$schema');
    expect(schema).toHaveProperty('type', 'object');
    expect(schema).toHaveProperty('properties');
    expect(schema).toHaveProperty('required');
  });
});