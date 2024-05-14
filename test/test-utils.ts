import { writeFile } from 'fs/promises';
import { join } from 'path';
import { file } from 'tmp';

import createReader, { ReaderOptions } from '../src';
import { IteratorResult } from '../src/buffered-file-reader';

const getTestFilePath = (fileName: string): string =>
  join(__dirname, 'files', fileName);

// Source: https://stackoverflow.com/a/49512933/9332813
class NoErrorThrownError extends Error {}

// Source: https://stackoverflow.com/a/49512933/9332813
const getError = async <TError>(call: () => unknown): Promise<TError> => {
  try {
    await call();
    throw new NoErrorThrownError();
  } catch (error: unknown) {
    return error as TError;
  }
};

/**
 * Runs the reader with the specified input string
 *
 * @param data    The input string
 * @param config  The reader config
 * @returns       The reader result
 */
const runReader = async (
  data: string,
  config: ReaderOptions,
): Promise<IteratorResult[]> => {
  const buff = Buffer.from(data);
  const filePath = await createTmpFile(buff);
  const r = createReader(filePath, config);

  const chunks: IteratorResult[] = [];
  for (let chunk = await r.next(); !chunk.done; chunk = await r.next())
    chunks.push(chunk.value);

  return chunks;
};

/**
 * Creates a temporary file with the specified content
 *
 * @param data  The file's content
 * @returns     The file path
 */
const createTmpFile = async (data: Buffer): Promise<string> => {
  const filePath = await new Promise<string>((resolve, reject) => {
    file((err, name) => {
      if (err) return reject(err);
      resolve(name);
    });
  });

  await writeFile(filePath, data);
  return filePath;
};

export {
  getTestFilePath,
  getError,
  NoErrorThrownError,
  createTmpFile,
  runReader,
};
