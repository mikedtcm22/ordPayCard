import { parseOpReturn, isExpired } from '../opReturn';

function asciiToHex(input: string): string {
  return Array.from(input)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
}

function encodeOpReturnPayload(payload: string): string {
  // OP_RETURN (0x6a) + PUSHDATA1 (if needed) or single-byte length + data
  const dataHex = asciiToHex(payload);
  const length = dataHex.length / 2;
  if (length <= 75) {
    const lenHex = length.toString(16).padStart(2, '0');
    return `6a${lenHex}${dataHex}`;
  } else {
    // Use OP_PUSHDATA1 (0x4c)
    const lenHex = length.toString(16).padStart(2, '0');
    return `6a4c${lenHex}${dataHex}`;
  }
}

describe('OP_RETURN extraction (A1)', () => {
  test('parseOpReturn returns null when no OP_RETURN present', () => {
    const rawTxHex = 'deadbeef';
    expect(parseOpReturn(rawTxHex)).toBeNull();
  });

  test('parseOpReturn throws on malformed hex', () => {
    const malformed = 'zz11';
    expect(() => parseOpReturn(malformed)).toThrow();
  });

  test('parseOpReturn extracts nftId and expiryBlock from valid OP_RETURN payload', () => {
    const nftId = 'inscription123';
    const expiry = 456789;
    const payload = `${nftId}|${expiry}`;
    const opret = encodeOpReturnPayload(payload);
    // Embed OP_RETURN anywhere in the tx hex; parser should find it.
    const rawTxHex = `010203${opret}aabbcc`;

    const parsed = parseOpReturn(rawTxHex);
    expect(parsed).not.toBeNull();
    expect(parsed!.nftId).toBe(nftId);
    expect(parsed!.expiryBlock).toBe(expiry);
  });

  test('isExpired returns true when current block is past expiry, false otherwise', () => {
    expect(isExpired(100, 101)).toBe(true); // past
    expect(isExpired(100, 100)).toBe(false); // at boundary
    expect(isExpired(100, 99)).toBe(false); // before
  });

  test('parseOpReturn supports OP_PUSHDATA2 encoded payloads', () => {
    // Keep payload length within 256 ASCII chars while still using PUSHDATA2 encoding
    const nftId = 'a'.repeat(250); // 250 + 1 (|) + 3 (123) = 254 bytes
    const expiry = '123';
    const payload = `${nftId}|${expiry}`;
    const dataHex = asciiToHex(payload);
    const len = dataHex.length / 2; // 254
    // OP_RETURN (6a) + OP_PUSHDATA2 (4d) + little-endian length (2 bytes)
    const lenLE = [len & 0xff, (len >> 8) & 0xff]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const opret = `6a4d${lenLE}${dataHex}`;
    const rawTxHex = `abcd${opret}ef01`;

    const parsed = parseOpReturn(rawTxHex);
    expect(parsed).not.toBeNull();
    expect(parsed!.nftId).toBe(nftId);
    expect(parsed!.expiryBlock).toBe(Number(expiry));
  });

  test('parseOpReturn throws when OP_RETURN payload exceeds 256 ASCII chars', () => {
    const nftId = 'x'.repeat(253); // 253 + 1 + 3 = 257 > 256
    const payload = `${nftId}|123`;
    const dataHex = asciiToHex(payload);
    const len = dataHex.length / 2; // 257
    const lenLE = [len & 0xff, (len >> 8) & 0xff]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const opret = `6a4d${lenLE}${dataHex}`; // Use proper PUSHDATA2 encoding
    const rawTxHex = `00${opret}`;
    expect(() => parseOpReturn(rawTxHex)).toThrow('OP_RETURN payload too large');
  });
});


