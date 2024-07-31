/**
 * The options for the buffered reader
 */
export type ReaderOptions = {
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

  /**
   * Whether to fail if the file is modified while its being
   * processed by the file reader.
   *
   * If set to `true`, the file will be tracked for changes
   * by `watchFile`. If any changes are done to the file
   * the following read will throw an error.
   *
   * See: https://nodejs.org/docs/latest/api/fs.html#fs_fs_watchfile_filename_options_listener
   *
   * Note that
   *
   * Defaults to `true`.
   */
  throwOnFileModification?: boolean;

  /**
   * The interval of file modification checks in milliseconds.
   *
   * The interval specifies at which rate the file stats should
   * be checked for any modifications.
   *
   * Note that the actual detection frequency is still relying
   * on the NodeJS file watcher.
   *
   * Defaults to `1000`
   */
  fileModificationPollInterval?: number;
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
       * the returned buffer size may be less or greater than the
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
   * Whether to throw if the file is modified during processing
   */
  public readonly throwOnFileModification: boolean = true;

  /**
   * The interval for file modification polls
   */
  public readonly fileModificationPollInterval: number = 1000;

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

    if (options.throwOnFileModification === false)
      this.throwOnFileModification = false;

    if (options.fileModificationPollInterval != null)
      this.fileModificationPollInterval = options.fileModificationPollInterval;

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
      throw new Error(`Empty separator supplied`);

    if (this.fileModificationPollInterval < 10)
      throw new Error(
        `Invalid file modification poll interval, must be at least 10, got ${this.fileModificationPollInterval}`,
      );
  }
}
