/** Hex helpers shared by parser utils */

export function assertValidHexString(hex: string): void {
  if (typeof hex !== 'string' || hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) {
    throw new Error('Malformed hex input');
  }
}

export function hexToBytes(hex: string): Uint8Array {
  assertValidHexString(hex);
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function asciiHexToString(dataHex: string): string {
  assertValidHexString(dataHex);
  let out = '';
  for (let i = 0; i < dataHex.length; i += 2) {
    const code = parseInt(dataHex.slice(i, i + 2), 16);
    out += String.fromCharCode(code);
  }
  return out;
}


