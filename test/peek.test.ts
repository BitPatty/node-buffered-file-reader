import { BufferedFileReader } from '../src';
import { createTmpFile } from './test-utils';

describe('Peek', () => {
  test('Peek Matches Next', async () => {
    const tempFile = await createTmpFile(Buffer.from('abcdefghi'));
    const reader = BufferedFileReader.create(tempFile, {
      chunkSize: 5,
    });

    const current = await reader.next();
    const peek = await current.value?.peekNext();
    const next = await reader.next();

    expect(peek).toBeDefined();

    expect({
      chunkCursor: peek?.chunkCursor,
      data: next.value?.data.toString(),
    }).toMatchObject({
      chunkCursor: next.value?.chunkCursor,
      data: next.value?.data.toString(),
    });

    await reader.return(null);
  });

  test('Peek Remembers Cusor Position', async () => {
    const tempFile = await createTmpFile(Buffer.from('abcdefghijklmnopqrst'));
    const reader = BufferedFileReader.create(tempFile, {
      chunkSize: 3,
    });

    const current = await reader.next();
    const peek1 = await current.value?.peekNext();
    await reader.next();
    await reader.next();
    const peek2 = await current.value?.peekNext();

    expect(peek1).toBeDefined();
    expect(peek1).toMatchObject(peek2!);

    await reader.return(null);
  });
});
