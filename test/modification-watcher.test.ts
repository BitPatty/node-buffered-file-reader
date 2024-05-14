import { writeFile } from 'fs/promises';

import { BufferedFileReader } from '../src';

import { createTmpFile, runFileReader } from './test-utils';

// The tests here are deliberatly waiting for one second
// For the NodeJS file watcher to process

describe('Modification Watcher', () => {
  test('Does Not Throw On Continuous Reads', async () => {
    const tempFile = await createTmpFile(Buffer.from('abc'));
    await expect(
      runFileReader(tempFile, { chunkSize: 1 }),
    ).resolves.not.toThrow();
  });

  test('Does Throw On Modifications', async () => {
    const tempFile = await createTmpFile(Buffer.from('abc'));
    const reader = BufferedFileReader.create(tempFile, {
      chunkSize: 1,
      fileModificationPollInterval: 100,
    });

    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    await expect(reader.next()).resolves.not.toThrow();

    await writeFile(tempFile, 'abcd');
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));

    await expect(() => reader.next()).rejects.toThrow(
      `File '${tempFile}' has been modified while processing`,
    );
  });

  test('Does Throw On Same Data Write', async () => {
    const tempFile = await createTmpFile(Buffer.from('abc'));
    const reader = BufferedFileReader.create(tempFile, {
      chunkSize: 1,
      fileModificationPollInterval: 100,
    });

    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    await expect(reader.next()).resolves.not.toThrow();

    await writeFile(tempFile, 'abc');
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));

    await expect(() => reader.next()).rejects.toThrow(
      `File '${tempFile}' has been modified while processing`,
    );
  });

  test('Does Not Throw On Modifications If Disabled', async () => {
    const tempFile = await createTmpFile(Buffer.from('abc'));
    const reader = BufferedFileReader.create(tempFile, {
      chunkSize: 1,
      throwOnFileModification: false,
      fileModificationPollInterval: 100,
    });

    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    await expect(reader.next()).resolves.not.toThrow();

    await writeFile(tempFile, 'abcd');
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));

    await expect(reader.next()).resolves.not.toThrow();
    await reader.return(null);
  });
});
