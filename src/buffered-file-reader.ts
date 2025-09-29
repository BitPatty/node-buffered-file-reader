import { watchFile, unwatchFile, StatsListener } from 'fs';
import { FileHandle, open } from 'fs/promises';

import { Configuration, ReaderOptions } from './configuration.js';

export type IteratorResult = {
  /**
   * The state of the chunk cursor for this data buffer.
   *
   * Note: Indexing starts at 0
   */
  chunkCursor: {
    /**
     * The cursor position at the start of where the initial chunk
     * of the current buffer was read.
     *
     * This number is inclusive, meaning that the byte at this
     * position has been read into the current data buffer.
     */
    start: number;

    /**
     * The cursor position at the end of where the last chunk of
     * the current buffer was read.
     *
     * This number is exclusive, meaning the the byte at this
     * position has not been read into the current data buffer.
     */
    end: number;
  };

  /**
   * Peeks at the next data buffer following the result of this
   * iteration without moving the cursor forward.
   *
   * @returns  The next data buffer
   */
  peekNext: () => Promise<Omit<IteratorResult, 'peekNext'> | null>;

  /**
   * The data in the current chunk
   */
  data: Buffer;
};

export type Iterator = AsyncGenerator<IteratorResult, null, undefined>;

export class BufferedFileReader {
  /**
   * The reader configuration
   */
  readonly #configuration: Configuration;

  /**
   * The path to the target file
   */
  readonly #filePath: string;

  /**
   * Whether the reader has already been started
   */
  #isStarted: boolean;

  /**
   * The file handle
   */
  #handle: FileHandle | undefined;

  /**
   * The watcher for file modifications
   */
  #fileModificationWatcher: StatsListener | undefined;

  /**
   * Whether the file has been modified
   */
  #hasFileBeenModified: boolean | undefined;

  /**
   * The current position of the file cursor
   */
  #cursorPosition = 0;

  /**
   * Creates a new file reader instance
   *
   * @param filePath  The path to the file
   * @param config    The reader configuration
   */
  private constructor(filePath: string, config: Configuration) {
    this.#filePath = filePath;
    this.#isStarted = false;
    this.#configuration = config;
    this.#cursorPosition = config.startOffset;
  }

  /**
   * Creates a new bufferd file reader
   *
   * @param filePath  The file path
   * @param options   The reader options
   * @returns         The file reader
   */
  public static create(filePath: string, options?: ReaderOptions): Iterator {
    const config = new Configuration(options ?? {});
    return new BufferedFileReader(filePath, config).start();
  }

  /**
   * Starts reading the file
   *
   * @returns  The iterator
   */
  public async *start(): Iterator {
    if (this.#isStarted) throw new Error(`Reader already started`);
    this.#isStarted = true;

    if (this.#configuration.throwOnFileModification)
      this.#startModificationWatcher();

    try {
      if (!this.#handle) await this.#openFileHandle();
      let nextChunk: IteratorResult | null = null;

      do {
        // Ensure there haven't been any modifications
        if (
          this.#configuration.throwOnFileModification &&
          this.#hasFileBeenModified
        )
          throw new Error(
            `File '${this.#filePath}' has been modified while processing`,
          );

        // Done
        nextChunk = await this.#readNextChunk(this.#cursorPosition);
        if (!nextChunk) return null;

        // Update the cursor position
        this.#cursorPosition = nextChunk.chunkCursor.end;

        // Yield the current entry
        yield nextChunk;
      } while (nextChunk != null);
    } finally {
      // Finally is called in the following events:
      // - The return above is called
      // - The return() is called manually
      // - The above code throws
      // - The throw() is called manually
      await this.#dispose();
    }

    return null;
  }

  /**
   * Reads the next chunk from the specified cursor position
   *
   * @param cursorStart  The cursor position
   * @returns            The chnunk or NULL if no further chunks could be read
   */
  async #readNextChunk(cursorStart: number): Promise<IteratorResult | null> {
    let nextChunk = await this.#readChunkAtOffset(cursorStart);
    if (nextChunk == null) return null;

    const cursorEnd = cursorStart + nextChunk.length;

    // Trim the separator if necessary
    if (this.#configuration.separator && this.#configuration.trimSeparator)
      nextChunk = this.#trimSeparator(nextChunk, this.#configuration.separator);

    return {
      chunkCursor: { start: cursorStart, end: cursorEnd },
      data: nextChunk,
      peekNext: async () => {
        const res = await this.#readNextChunk(cursorEnd);
        if (!res) return null;
        const { peekNext: _, ...ret } = res;
        return ret;
      },
    };
  }

  /**
   * Reads the next chunk with the current configuration
   * at the specified starting position
   *
   * @param startOffset  The offset from which to start reading
   * @returns            The next chunk
   */
  #readChunkAtOffset(startOffset: number): Promise<Buffer | null> {
    if (this.#configuration.separator)
      return this.#readChunkToSeparator(
        this.#configuration.chunkSize,
        this.#configuration.separator,
        startOffset,
      );

    return this.#readChunk(this.#configuration.chunkSize, startOffset);
  }

  /**
   * Trims the separator from the end of the chunk
   *
   * @param chunk      The chunk
   * @param separator  The separator
   * @returns          The trimmed buffer
   */
  #trimSeparator(chunk: Buffer, separator: Uint8Array): Buffer {
    // Ensure the separator is present
    for (let i = separator.length; i > 0; i--) {
      if (i > chunk.length) return chunk;
      if (chunk[chunk.length - i] !== separator[separator.length - i])
        return chunk;
    }

    // If present, return the trimmed chunk
    return chunk.subarray(0, chunk.length - separator.length);
  }

  /**
   * Finds the index of the specified pattern in the specified buffer
   *
   * @param buff     The buffer
   * @param pattern  The pattern to find
   * @param offset   The offset from which to start searching
   * @returns        The index of the pattern or NULL if it wasn't found
   */
  #findPatternIndex(
    buff: Buffer,
    pattern: Uint8Array,
    offset = 0,
  ): number | null {
    // No pattern
    if (pattern.length === 0) return null;

    // Buffer too small
    if (buff.length < pattern.length) return null;

    for (let i = offset; i < buff.length; i++) {
      // Check if it's the first matching byte
      if (buff[i] !== pattern[0]) continue;

      // If the first byte matches & there's only
      // one byte in the pattern -> done
      if (pattern.length === 1) return i;

      // Check the rest of the pattern
      for (let j = 1; j < pattern.length && i + j < buff.length; j++) {
        // Pattern mismatch
        if (buff[i + j] !== pattern[j]) break;

        // If end of pattern -> done
        if (j === pattern.length - 1) return i;
      }
    }

    return null;
  }

  /**
   * Continues reading the file until it either:
   * - finds a chunk containing the separator
   * - reaches the end of the file
   *
   * @param chunkSize  The chunk size per read operation
   * @param separator  The separator pattern
   * @param offset     The start offset
   * @returns          The bytes starting from the offset until the end of
   *                   end of the pattern or the end of the file
   */
  async #readChunkToSeparator(
    chunkSize: number,
    separator: Uint8Array,
    offset = 0,
  ): Promise<Buffer | null> {
    // Get the current chunk
    const current = await this.#readChunk(chunkSize + separator.length, offset);
    if (current == null) return null;

    // Find the separator, and return the chunk up to the enx
    // of the separator if there is a match
    const sIdx = this.#findPatternIndex(current, separator, 0);
    if (sIdx != null) return current.subarray(0, sIdx + separator.length);

    // Current entry reached the end of the file
    if (current.length < chunkSize + separator.length) return current;

    // Continue with the next chunk
    const next = await this.#readChunkToSeparator(
      chunkSize,
      separator,
      offset + current.length - separator.length,
    );

    // If there is nothing left, return
    if (next == null) return current;

    // Append the next chunk to the current one
    return Buffer.concat([
      current.subarray(0, current.length - separator.length),
      next,
    ]);
  }

  /**
   * Reads a portion of the file
   *
   * @param length  The buffer length
   * @param offset  The read offset
   * @returns       The read bytes or NULL if the offset exceeds the file size
   */
  async #readChunk(length: number, offset = 0): Promise<Buffer | null> {
    if (!this.#handle) throw new Error('Handle not opened');
    const buffer = Buffer.alloc(length, 0);
    const res = await this.#handle.read(buffer, 0, length, offset);
    if (res.bytesRead === 0) return null;
    return res.buffer.subarray(0, res.bytesRead);
  }

  /**
   * Starts the modification watcher, setting the #hasFileBeenModified
   * flag whenever there is a modification to the file.
   */
  #startModificationWatcher(): void {
    if (this.#fileModificationWatcher)
      throw new Error(`Modification watcher already registerd`);

    this.#fileModificationWatcher = (curr, next) => {
      if (curr.mtimeMs !== next.mtimeMs) this.#hasFileBeenModified = true;
    };

    watchFile(
      this.#filePath,
      { interval: this.#configuration.fileModificationPollInterval },
      this.#fileModificationWatcher,
    );
  }

  /**
   * Stops the modification watcher if it has been started.
   */
  #stopModificationWatcher(): void {
    if (!this.#fileModificationWatcher) return;
    unwatchFile(this.#filePath, this.#fileModificationWatcher);
  }

  /**
   * Opens the file handle
   */
  async #openFileHandle(): Promise<void> {
    if (this.#handle) throw new Error('Handle already opened');
    this.#handle = await open(this.#filePath);
  }

  /**
   * Closes the file handle
   */
  async #closeFileHandle(): Promise<void> {
    if (this.#handle == null) return;
    await this.#handle.close();
    this.#handle = undefined;
  }

  async #dispose(): Promise<void> {
    this.#stopModificationWatcher();
    await this.#closeFileHandle();
  }
}
