import createReader, { Separator } from '../src';

import { createTmpFile } from './test-utils';

describe('Split', () => {
  describe.each([[1], [2], [3], [4], [5], [6], [100]])(
    'Chunk Size %i',
    (chunkSize: number) => {
      test.each([[true, false]])(
        'Empty Buffer Returns Empty Buffer (Trimmed: %b)',
        async (trim: boolean) => {
          const buff = Buffer.alloc(0);
          const filePath = await createTmpFile(buff);

          const r = createReader(filePath, {
            separator: Separator.CRLF,
            chunkSize,
            trimSeparator: trim,
          });

          const chunks: Buffer[] = [];
          for (let chunk = await r.next(); !chunk.done; chunk = await r.next())
            chunks.push(chunk.value);

          expect(chunks.length).toEqual(0);
        },
      );

      test('Splits CRLF', async () => {
        const buff = Buffer.from('abc\r\nghi\r\njkl');
        const filePath = await createTmpFile(buff);
        const r = createReader(filePath, {
          separator: Separator.CRLF,
          chunkSize,
        });

        const chunks: Buffer[] = [];
        for (let chunk = await r.next(); !chunk.done; chunk = await r.next())
          chunks.push(chunk.value);

        expect(chunks.length).toEqual(3);
        expect(chunks[0].toString()).toEqual('abc\r\n');
        expect(chunks[1].toString()).toEqual('ghi\r\n');
        expect(chunks[2].toString()).toEqual('jkl');
      });

      test('Splits LF', async () => {
        const buff = Buffer.from('abc\r\nghi\r\njkl');
        const filePath = await createTmpFile(buff);
        const r = createReader(filePath, {
          separator: Separator.LF,
          chunkSize,
        });

        const chunks: Buffer[] = [];
        for (let chunk = await r.next(); !chunk.done; chunk = await r.next())
          chunks.push(chunk.value);

        expect(chunks.length).toEqual(3);
        expect(chunks[0].toString()).toEqual('abc\r\n');
        expect(chunks[1].toString()).toEqual('ghi\r\n');
        expect(chunks[2].toString()).toEqual('jkl');
      });

      test('Splits CR', async () => {
        const buff = Buffer.from('abc\r\nghi\r\njkl');
        const filePath = await createTmpFile(buff);
        const r = createReader(filePath, {
          separator: Separator.CR,
          chunkSize,
        });

        const chunks: Buffer[] = [];
        for (let chunk = await r.next(); !chunk.done; chunk = await r.next())
          chunks.push(chunk.value);

        expect(chunks.length).toEqual(3);
        expect(chunks[0].toString()).toEqual('abc\r');
        expect(chunks[1].toString()).toEqual('\nghi\r');
        expect(chunks[2].toString()).toEqual('\njkl');
      });

      test('Trims CR', async () => {
        const buff = Buffer.from('abc\r\nghi\r\njkl');
        const filePath = await createTmpFile(buff);
        const r = createReader(filePath, {
          separator: Separator.CR,
          chunkSize,
          trimSeparator: true,
        });

        const chunks: Buffer[] = [];
        for (let chunk = await r.next(); !chunk.done; chunk = await r.next())
          chunks.push(chunk.value);

        expect(chunks.length).toEqual(3);
        expect(chunks[0].toString()).toEqual('abc');
        expect(chunks[1].toString()).toEqual('\nghi');
        expect(chunks[2].toString()).toEqual('\njkl');
      });

      test('Trims CRLF', async () => {
        const buff = Buffer.from('abc\r\nghi\r\njkl');
        const filePath = await createTmpFile(buff);
        const r = createReader(filePath, {
          separator: Separator.CRLF,
          chunkSize,
          trimSeparator: true,
        });

        const chunks: Buffer[] = [];
        for (let chunk = await r.next(); !chunk.done; chunk = await r.next())
          chunks.push(chunk.value);

        expect(chunks.length).toEqual(3);
        expect(chunks[0].toString()).toEqual('abc');
        expect(chunks[1].toString()).toEqual('ghi');
        expect(chunks[2].toString()).toEqual('jkl');
      });

      test('Trims LF', async () => {
        const buff = Buffer.from('abc\r\nghi\r\njkl');
        const filePath = await createTmpFile(buff);
        const r = createReader(filePath, {
          separator: Separator.LF,
          chunkSize,
          trimSeparator: true,
        });

        const chunks: Buffer[] = [];
        for (let chunk = await r.next(); !chunk.done; chunk = await r.next())
          chunks.push(chunk.value);

        expect(chunks.length).toEqual(3);
        expect(chunks[0].toString()).toEqual('abc\r');
        expect(chunks[1].toString()).toEqual('ghi\r');
        expect(chunks[2].toString()).toEqual('jkl');
      });
    },
  );
});
