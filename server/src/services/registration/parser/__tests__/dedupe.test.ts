import { dedupeTxids } from '../dedupe';

describe('dedupeTxids (A4)', () => {
  test('returns empty array when input is empty', () => {
    expect(dedupeTxids([])).toEqual([]);
  });

  test('preserves order and removes duplicates', () => {
    const input = [
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    ];
    const output = dedupeTxids(input);
    expect(output).toEqual([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    ]);
  });

  test('no duplicates → returns original array copy', () => {
    const input = [
      '1111111111111111111111111111111111111111111111111111111111111111',
      '2222222222222222222222222222222222222222222222222222222222222222',
      '3333333333333333333333333333333333333333333333333333333333333333',
    ];
    const output = dedupeTxids(input);
    expect(output).toEqual(input);
    expect(output).not.toBe(input); // ensure returned array is a new instance
  });

  test('keeps first occurrence when the same txid repeats many times', () => {
    const tx = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const input = [tx, tx, tx, tx];
    const output = dedupeTxids(input);
    expect(output).toEqual([tx]);
  });

  test('treats different casing as distinct values (no normalization)', () => {
    const lower = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const upper = lower.toUpperCase();
    const output = dedupeTxids([lower, upper, lower]);
    expect(output).toEqual([lower, upper]);
  });

  test('whitespace differences are considered distinct (no trimming)', () => {
    const base = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const spaced = ` ${base}`;
    const output = dedupeTxids([base, spaced, base]);
    expect(output).toEqual([base, spaced]);
  });
});


