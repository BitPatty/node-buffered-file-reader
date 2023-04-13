import createReader from '../src';

import { getError, getTestFilePath, NoErrorThrownError } from './test-utils';

describe('Invalid File', () => {
  test('Non-Existing File Throws ENOENT', async () => {
    const error = await getError(() =>
      createReader(getTestFilePath('no-file.bin')).next(),
    );
    expect(error).not.toBeInstanceOf(NoErrorThrownError);

    // @ts-expect-error Error of type unknown
    expect(error?.['code']).toEqual('ENOENT');
  });

  test('Directory Throws EISDIR', async () => {
    const error = await getError(() => createReader(__dirname).next());
    expect(error).not.toBeInstanceOf(NoErrorThrownError);
    // @ts-expect-error Error of type unknown
    expect(error?.['code']).toEqual('EISDIR');
  });
});
