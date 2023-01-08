import { KDFSHA512, sumSHA512 } from '../kdf';
import { stringToUint8Array, uint8ArrayToHex } from '../math';

describe('key derivation functions', () => {
  it('SHA512 sum will match golang #1', async () => {
    const result = await sumSHA512(stringToUint8Array('my string for hashing'));
    expect(uint8ArrayToHex(result)).toMatch(/4DC43467FE9140F217821252F94BE94E49F963EED1889BCEAB83A1C36FFE3EFE87334510605A9BF3B644626AC0CD0827A980B698EFBC1BDE75B537172AB8DBD0/i);
  });
  it('SHA512 sum will match golang #2', async () => {
    const result = await sumSHA512(stringToUint8Array('another test string that should match golang'));
    expect(uint8ArrayToHex(result)).toMatch(/36ED8EF8DA5C2146C5605062880339CAAB10FA80FA80DD830964269243C4959D2E6620C48C21214A51BC5AF621FB2EA8D0A7EFF56309F7379C41F928DDDE2A87/i);
  });

  it('will generate the same key given the same inputs', async () => {
    const username = 'email@test.com';
    const password = 'superSecureP@ssw0rd';
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const result = (await KDFSHA512(salt, username, password)).toString();

    expect(result.toString()).toMatch(/12856018848517016028479401842283390627401925757530482314969075902347016669028099510997751214909860626094833238065964417628939751560486534501892058187142032/i);
  });
});
