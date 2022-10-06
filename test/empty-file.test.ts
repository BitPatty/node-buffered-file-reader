import { assert } from 'console';
import { statSync } from 'fs';

import createReader from '../src';

import { getTestFilePath } from './test-utils';

const filePath = getTestFilePath('empty-file.bin');
const fileSize = statSync(filePath).size;

assert(fileSize === 0);

describe('Empty File', () => {
  test('Returns empty chunk', async () => {
    const r = createReader(filePath);
    const c = await r.next();
    expect(c.done).toBe(true);
  });

  test('Separator returns empty chunk', async () => {
    const r = createReader(filePath, {
      separator: new Uint8Array([0x00]),
    });
    const c = await r.next();
    expect(c.done).toBe(true);
  });
});
