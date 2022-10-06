/**
 * The options for the buffered reader
 */
type ReaderOptions =
  | {
      /**
       * The byte offset from which the reader should start
       */
      startOffset?: number;

      /**
       * The default chunk size of the reader. If provided, the
       * specified number of bytes is read on each read operation.
       *
       * Defaults to `100`
       */
      chunkSize?: number;
    } & (
      | {
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
          separator: Uint8Array;

          /**
           * Whether to trim the separator pattern from the returned
           * buffers
           */
          trimSeparator?: boolean;
        }
      | {
          separator?: undefined;
          trimSeparator?: never;
        }
    );

class Configuration {
  public readonly startOffset: number = 0;
  public readonly separator: Uint8Array | null = null;
  public readonly chunkSize: number = 100;
  public readonly trimSeparator: boolean = false;

  public constructor(options: ReaderOptions) {
    if (options.startOffset) this.startOffset = options.startOffset;
    if (options.chunkSize) this.chunkSize = options.chunkSize;
    if (options.separator) this.separator = options.separator;
    if (options.trimSeparator != null)
      this.trimSeparator = options.trimSeparator;
  }
}

export default Configuration;
export { ReaderOptions };
