import BufferedFileReader from './buffered-file-reader';
import Configuration, { ReaderOptions } from './configuration';

const createReader = (filePath: string): AsyncGenerator<Buffer | null> =>
  BufferedFileReader.create(filePath);

export default createReader;
export { BufferedFileReader, Configuration, ReaderOptions };
