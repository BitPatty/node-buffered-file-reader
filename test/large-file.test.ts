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
    for (let chunk = await r.next(); !chunk.done; chunk = await r.next()) i++;

    expect(i).toEqual(fileSize / 100);
  });

  test('Returns Partial Last Chunks', async () => {
    const r = createReader(filePath, {
      chunkSize: 3,
    });

    let i = 0;
    let lastChunk: Buffer | null = null;
    for (let chunk = await r.next(); !chunk.done; chunk = await r.next()) {
      i++;
      lastChunk = chunk.value.data;
    }

    expect(i).toEqual(Math.ceil(fileSize / 3));
    expect(lastChunk?.length).toEqual(1);
  });

  test('Chunks Match Original File', async () => {
    const fileContent = await readFile(filePath);

    let buff = Buffer.alloc(0);

    const r = createReader(filePath, {
      chunkSize: 33,
    });

    for (let chunk = await r.next(); !chunk.done; chunk = await r.next())
      buff = Buffer.concat([buff, chunk.value.data]);

    expect(buff.length).toEqual(fileContent.length);
    for (let i = 0; i < fileContent.length; i++)
      expect(buff[i]).toEqual(fileContent[i]);
  });
});
