import {
  BufferedFileReader,
  Iterator,
  IteratorResult,
} from './buffered-file-reader.js';
import { Configuration, ReaderOptions } from './configuration.js';
import { Separator } from './separator.js';

const createReader = (filePath: string, options?: ReaderOptions): Iterator =>
  BufferedFileReader.create(filePath, options);

export default createReader;
export {
  BufferedFileReader,
  Configuration,
  ReaderOptions,
  Separator,
  Iterator,
  IteratorResult,
};
