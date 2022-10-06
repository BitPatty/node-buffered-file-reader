/**
 * The options for the buffered reader
 */
type ReaderOptions = {
  /**
   * The byte offset from which the reader should start
   */
  startOffset: number;

  /**
   * The byte pattern to identify the end of a chunk.
   *
   * If provided, the reader continues to read bytes into
   * a chunk until it finds one of the separators and will
   * continue reading from the end of the chunk during the
   * next iteration.
   *
   * If separator is not configured, the reader instead fills
   * a chunk to the specified chunk size.
   */
  separator: number | number[];

  /**
   * The default chunk size of the reader. If provided, the
   * specified number of bytes is read on each read operation.
   *
   * Defaults to `100`
   */
  chunkSize: number;
};

class Configuration {
  public readonly startOffset: number;
  public readonly separators: number[];
  public readonly chunkSize: number;

  public constructor(options: Partial<ReaderOptions>) {
    this.startOffset = options.startOffset ?? 0;
    this.chunkSize = options.chunkSize ?? 100;
    this.separators = options.separator
      ? Array.isArray(options.separator)
        ? options.separator
        : [options.separator]
      : [];
  }
}

export default Configuration;
export { ReaderOptions };
