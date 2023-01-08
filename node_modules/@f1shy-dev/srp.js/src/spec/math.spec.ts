import { constantTimeCompare, exp } from '../math';

describe('exp', () => {
  it('will calculate the modular exponentiation', () => {
    expect(exp(BigInt(12), BigInt(53), BigInt(7))).toBe(BigInt(3));
    expect(exp(BigInt(7), BigInt(12), BigInt(10))).toBe(BigInt(1));
    expect(exp(BigInt(3), BigInt(51), BigInt(13))).toBe(BigInt(1));
  });

  it('will match golang', () => {

  })
});

describe('constant time compare', () => {
  it('will compare two byte arrays for equality', () => {
    const a = new Uint8Array([1, 2, 3, 4, 5]);
    const b = new Uint8Array([1, 2, 3, 4, 5]);
    expect(constantTimeCompare(a, b)).toBeTruthy();
  });

  it('will compare two byte arrays for inequality', () => {
    const a = new Uint8Array([1, 2, 3, 4, 5]);
    const b = new Uint8Array([1, 2, 3, 4, 6]);
    expect(constantTimeCompare(a, b)).toBeFalsy();
  })
});
