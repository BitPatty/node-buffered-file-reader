import createReader, { Separator } from '../src';

import { createTmpFile, runReader } from './test-utils';

const CHUNK_SIZES = new Array(20).fill(null).map((_, idx) => [idx + 1]);

describe('Separator Split', () => {
  describe.each(CHUNK_SIZES)('Chunk Size %i', (chunkSize: number) => {
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
          chunks.push(chunk.value.data);

        expect(chunks.length).toEqual(0);
      },
    );

    describe.each([
      [Separator.CR, '\r'],
      [Separator.CRLF, '\r\n'],
      [Separator.NULL_TERMINATOR, '\0'],
      [Separator.LF, '\n'],
    ])('Separator: "%s"', (separator, chars) => {
      test('Splits At Start Of String', async () => {
        const str = `${chars}abcdef`;
        const out = [chars, 'abcdef'];

        await expect(
          runReader(str, { separator, chunkSize }),
        ).resolves.toMatchChunks(out);
      });

      test('Splits At Middle Of String', async () => {
        const str = `abc${chars}def`;
        const out = [`abc${chars}`, 'def'];

        await expect(
          runReader(str, { separator, chunkSize }),
        ).resolves.toMatchChunks(out);
      });

      test('Splits At End Of String', async () => {
        const str = `abcdef${chars}`;
        const out = [`abcdef${chars}`];

        await expect(
          runReader(str, { separator, chunkSize }),
        ).resolves.toMatchChunks(out);
      });

      test('Splits At Start/Middle/End Of String', async () => {
        const str = `${chars}abc${chars}def${chars}`;
        const out = [chars, `abc${chars}`, `def${chars}`];

        await expect(
          runReader(str, { separator, chunkSize }),
        ).resolves.toMatchChunks(out);
      });

      test('Splits Chains', async () => {
        const str = `${chars}${chars}abc${chars}${chars}def${chars}${chars}`;
        const out = [chars, chars, `abc${chars}`, chars, `def${chars}`, chars];

        await expect(
          runReader(str, { separator, chunkSize }),
        ).resolves.toMatchChunks(out);
      });

      test('Splits And Trims At Start Of String', async () => {
        const str = `${chars}abcdef`;
        const out = ['', 'abcdef'];

        await expect(
          runReader(str, { separator, chunkSize, trimSeparator: true }),
        ).resolves.toMatchChunks(out);
      });

      test('Splits And Trims At Middle Of String', async () => {
        const str = `abc${chars}def`;
        const out = ['abc', 'def'];

        await expect(
          runReader(str, { separator, chunkSize, trimSeparator: true }),
        ).resolves.toMatchChunks(out);
      });

      test('Splits And Trims At End Of String', async () => {
        const str = `abcdef${chars}`;
        const out = ['abcdef'];

        await expect(
          runReader(str, { separator, chunkSize, trimSeparator: true }),
        ).resolves.toMatchChunks(out);
      });

      test('Splits And Trims At Start/Middle/End Of String', async () => {
        const str = `${chars}abc${chars}def${chars}`;
        const out = ['', 'abc', 'def'];

        await expect(
          runReader(str, { separator, chunkSize, trimSeparator: true }),
        ).resolves.toMatchChunks(out);
      });

      test('Splits And Trims Chains', async () => {
        const str = `${chars}${chars}abc${chars}${chars}def${chars}${chars}`;
        const out = ['', '', 'abc', '', 'def', ''];

        await expect(
          runReader(str, { separator, chunkSize, trimSeparator: true }),
        ).resolves.toMatchChunks(out);
      });
    });
  });
});
