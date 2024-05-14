/**
 * The options for the buffered reader
 */
export type ReaderOptions =
  | {
      /**
       * The offset (in bytes) from which to start reading the file.
       *
       * If set to a number greater than 0, that number of bytes
       * will be skipped when reading the first chunk.
       */
      startOffset?: number;

      /**
       * The default chunk size of the reader.
       *
       * If provided, the specified number of bytes is read on each
       * read operation. If no separator is configured, this will
       * also be the size of the buffer returned on each iteration.
       *
       * Note that when the reader reaches the end of the file,
       * the buffer size may be less than the chunk size.
       *
       * Defaults to `100`
       */
      chunkSize?: number;
    } & (
      | {
          /**
           * The byte pattern to identify the end of a section.
           *
           * If provided, the reader continues to read bytes into the buffer
           * until it encounters the separator and continues reading from
           * the end of the separator during the next iteration.
           *
           * This is especially useful when dealing with text files with
           * a delimiter (such as newlines). Note that the chunk size
           * configuration still applies for read operations. However,
           * the returned buffer size may be lower or higher than the
           * configured size, depending on where it encounters the
           * separator pattern.
           *
           * Defaults to `undefined`
           */
          separator: Uint8Array;

          /**
           * Whether the encountered separator should be trimmed from
           * The returned buffer. This configuration is ignored if no
           * separator is specified.
           *
           * If this is set to true the separator will be removed from
           * the end of the buffer before being returned as result of
           * the current iteration, else it is kept in the buffer.
           *
           * E.g. The file 0x12345678 with the separator 0x56 will return
           *      0x1234 if this is set to `true`, else it will return
           *      0x123456.
           *
           * Defaults to `false`
           */
          trimSeparator?: boolean;
        }
      | {
          separator?: undefined;
          trimSeparator?: never;
        }
    );

export class Configuration {
  /**
   * The start offset of the first read operation in bytes
   */
  public readonly startOffset: number = 0;
  /**
   * The separator up to which chunks should be read into
   * the current data buffer
   */
  public readonly separator: Uint8Array | null = null;
  /**
   * The size of a chunk to read from the source file on each
   * read operation.
   */
  public readonly chunkSize: number = 100;
  /**
   * Whether to trim the separator from the data buffer
   */
  public readonly trimSeparator: boolean = false;

  /**
   * Creates a new configuration instance
   *
   * @param options  The configuration options
   */
  public constructor(options: ReaderOptions) {
    if (options.startOffset != null) this.startOffset = options.startOffset;
    if (options.chunkSize != null) this.chunkSize = options.chunkSize;
    if (options.separator != null) this.separator = options.separator;
    if (options.separator != null && options.trimSeparator != null)
      this.trimSeparator = options.trimSeparator;

    this.#validateConfig();
  }

  /**
   * Validates the configuration values
   */
  #validateConfig(): void {
    if (this.startOffset < 0)
      throw new Error(`Start offset must be >= 0, got ${this.startOffset}`);

    if (this.chunkSize <= 0)
      throw new Error(`Chunk Size must be > 0, got ${this.chunkSize}`);

    if (this.separator && this.separator.length <= 0)
      throw new Error(`Empty separator`);
  }
}
