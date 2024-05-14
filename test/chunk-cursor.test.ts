import { Separator } from '../src';
import { runReader } from './test-utils';

describe('Chunk Cursor', () => {
  test('Initial Cursor Start', async () => {
    const sampleChunk = 'abcdef';
    const chunks = await runReader(sampleChunk, { chunkSize: 3 });
    expect(chunks[0]).toBeDefined();
    expect(chunks[0].chunkCursor.start).toEqual(0);
  });

  test('Initial Cursor End', async () => {
    const sampleChunk = 'abcdef';
    const chunks = await runReader(sampleChunk, { chunkSize: 3 });
    expect(chunks[0]).toBeDefined();
    expect(chunks[0].chunkCursor.end).toEqual(3);
  });

  test('Initial Cursor Start On Larger Chunk Size Than Content', async () => {
    const sampleChunk = 'abcdef';
    const chunks = await runReader(sampleChunk, { chunkSize: 10 });
    expect(chunks[0]).toBeDefined();
    expect(chunks[0].chunkCursor.start).toEqual(0);
  });

  test('Initial Cursor End On Larger Chunk Size Than Content', async () => {
    const sampleChunk = 'abcdef';
    const chunks = await runReader(sampleChunk, { chunkSize: 10 });
    expect(chunks[0]).toBeDefined();
    expect(chunks[0].chunkCursor.start).toEqual(0);
    expect(chunks[0].chunkCursor.end).toEqual(6);
  });

  test('Initial Cursor Start With Start Offset', async () => {
    const sampleChunk = 'abcdef';
    const chunks = await runReader(sampleChunk, {
      chunkSize: 3,
      startOffset: 2,
    });
    expect(chunks[0]).toBeDefined();
    expect(chunks[0].chunkCursor.start).toEqual(2);
  });

  test('Initial Cursor End With start Offset', async () => {
    const sampleChunk = 'abcdef';
    const chunks = await runReader(sampleChunk, {
      chunkSize: 10,
      startOffset: 2,
    });
    expect(chunks[0]).toBeDefined();
    expect(chunks[0].chunkCursor.end).toEqual(6);
  });

  test('Secondary Cursor Start', async () => {
    const sampleChunk = 'abcdef';
    const chunks = await runReader(sampleChunk, { chunkSize: 3 });
    expect(chunks[1]).toBeDefined();
    expect(chunks[1].chunkCursor.start).toEqual(3);
  });

  test('Secondary Cursor End', async () => {
    const sampleChunk = 'abcdef';
    const chunks = await runReader(sampleChunk, { chunkSize: 3 });
    expect(chunks[1]).toBeDefined();
    expect(chunks[1].chunkCursor.end).toEqual(6);
  });

  test('End Of Chunk N Matches Start Of Chunk N+1', async () => {
    const sampleChunk = 'abcdef';
    const chunks = await runReader(sampleChunk, { chunkSize: 4 });
    expect(chunks[0]).toBeDefined();
    expect(chunks[1]).toBeDefined();
    expect(chunks[0].chunkCursor.end).toEqual(chunks[1].chunkCursor.start);
  });

  test('Cursor Position With Separators', async () => {
    const sampleChunk = 'ab\ncdef\ngh';
    const chunks = await runReader(sampleChunk, {
      chunkSize: 2,
      separator: Separator.LF,
    });

    expect(chunks[0]).toBeDefined();
    expect(chunks[1]).toBeDefined();
    expect(chunks[2]).toBeDefined();

    expect(chunks[0].chunkCursor).toMatchObject({
      start: 0,
      end: 3,
    });
    expect(chunks[1].chunkCursor).toMatchObject({
      start: 3,
      end: 8,
    });
    expect(chunks[2].chunkCursor).toMatchObject({
      start: 8,
      end: 10,
    });
  });
});
