import { writeFile } from 'fs/promises';
import { join } from 'path';
import { file } from 'tmp';

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

export { getTestFilePath, getError, NoErrorThrownError, createTmpFile };
