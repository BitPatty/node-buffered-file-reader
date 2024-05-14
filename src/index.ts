import {
  BufferedFileReader,
  Iterator,
  IteratorResult,
} from './buffered-file-reader';
import { Configuration, ReaderOptions } from './configuration';
import { Separator } from './separator';

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
