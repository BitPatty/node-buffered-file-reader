import * as assert from 'assert';
import { statSync } from 'fs';
import { readFile } from 'fs/promises';

import createReader from '../src';

import { getTestFilePath } from './test-utils';

const filePath = getTestFilePath('large-file.bin');
const fileSize = statSync(filePath).size;

assert(fileSize === 1e5);

describe('Large File', () => {
  test('Returns The Right Number Of Chunks', async () => {
    const r = createReader(filePath);

    let i = 0;
    let done = false;
    do {
      const c = await r.next();
      done = c.done === true;
      if (!done) i++;
    } while (!done);

    expect(i).toEqual(fileSize / 100);
  });

  test('Returns Partial Last Chunks', async () => {
    const r = createReader(filePath, {
      chunkSize: 3,
    });

    let i = 0;
    let done = false;
    let lastChunk: Buffer | null = null;
    do {
      const c = await r.next();

      if (!c.done) {
        lastChunk = c.value;
        i++;
      } else {
        done = true;
      }
    } while (!done);

    expect(i).toEqual(Math.ceil(fileSize / 3));
    expect(lastChunk?.length).toEqual(1);
  });

  test('Chunks Match Original File', async () => {
    const fileContent = await readFile(filePath);

    let buff = Buffer.alloc(0);

    const r = createReader(filePath, {
      chunkSize: 33,
    });

    let done = false;
    do {
      const c = await r.next();

      if (!c.done) {
        buff = Buffer.concat([buff, c.value]);
      } else {
        done = true;
      }
    } while (!done);

    expect(buff.length).toEqual(fileContent.length);
    for (let i = 0; i < fileContent.length; i++)
      expect(buff[i]).toEqual(fileContent[i]);
  });
});
