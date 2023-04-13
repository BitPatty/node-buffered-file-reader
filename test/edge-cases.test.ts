import { assert } from 'console';
import { statSync } from 'fs';

import createReader, { Separator } from '../src';

import { getTestFilePath, runReader } from './test-utils';

const LONG_STRING = new Array(1234).fill('abc').join('');

const filePath = getTestFilePath('empty-file.bin');
const fileSize = statSync(filePath).size;

assert(fileSize === 0);

describe('Edge Cases', () => {
  test('Start Offset Greater Than Input Size Returns Empty Chunk', async () => {
    await expect(runReader('abc', { startOffset: 8 })).resolves.toMatchChunks([
      '',
    ]);
  });

  test('Chunk Size Greater Than Input Size Returns Input', async () => {
    await expect(runReader('abc', { chunkSize: 100 })).resolves.toMatchChunks([
      'abc',
    ]);
  });

  test('Long Input With Non Present Separator Returns Input', async () => {
    await expect(
      runReader(LONG_STRING, {
        separator: Separator.NULL_TERMINATOR,
      }),
    ).resolves.toMatchChunks([LONG_STRING]);
  });

  test('Empty File Returns Empty Chunk', async () => {
    const r = createReader(filePath);
    const c = await r.next();
    expect(c.done).toBe(true);
  });

  test('Empty File With Separator Returns Empty Chunkk', async () => {
    const r = createReader(filePath, {
      separator: new Uint8Array([0x00]),
    });
    const c = await r.next();
    expect(c.done).toBe(true);
  });
});
