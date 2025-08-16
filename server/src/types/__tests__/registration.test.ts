import { normalizeRegistration } from '../registration';

describe('RegistrationRecord normalization (B2)', () => {
  const validRawRegistration = {
    schema: 'buyer_registration.v1',
    parent: 'abc123i0',
    paid_to: 'tb1qexample',
    fee_sats: 50000,
    txid: 'deadbeef123',
    timestamp: '2025-01-01T12:00:00Z',
    childId: 'def456i0'
  };

  it('normalizes valid registration with all required fields', () => {
    const result = normalizeRegistration(validRawRegistration);
    
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      schema: 'buyer_registration.v1',
      parent: 'abc123i0',
      paid_to: 'tb1qexample', 
      fee_sats: 50000,
      txid: 'deadbeef123',
      timestamp: '2025-01-01T12:00:00Z',
      feeTxid: 'deadbeef123', // normalized
      amount: 50000, // normalized
      childId: 'def456i0'
    });
  });

  it('handles registration without childId', () => {
    const withoutChildId = { ...validRawRegistration };
    delete (withoutChildId as any).childId;
    
    const result = normalizeRegistration(withoutChildId);
    
    expect(result).not.toBeNull();
    expect(result!.childId).toBeUndefined();
    expect(result!.feeTxid).toBe('deadbeef123');
    expect(result!.amount).toBe(50000);
  });

  it('returns null for invalid schema', () => {
    const invalidSchema = { ...validRawRegistration, schema: 'invalid.v1' };
    expect(normalizeRegistration(invalidSchema)).toBeNull();
  });

  it('returns null for missing required fields', () => {
    const missingParent = { ...validRawRegistration };
    delete (missingParent as any).parent;
    expect(normalizeRegistration(missingParent)).toBeNull();
    
    const missingTxid = { ...validRawRegistration };
    delete (missingTxid as any).txid;
    expect(normalizeRegistration(missingTxid)).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(normalizeRegistration(null)).toBeNull();
    expect(normalizeRegistration(undefined)).toBeNull();
    expect(normalizeRegistration('string')).toBeNull();
    expect(normalizeRegistration(123)).toBeNull();
  });

  it('handles wrong field types gracefully', () => {
    const wrongTypes = {
      ...validRawRegistration,
      fee_sats: 'not-a-number',
      parent: 123
    };
    expect(normalizeRegistration(wrongTypes)).toBeNull();
  });
});
