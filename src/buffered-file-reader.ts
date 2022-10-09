import { FileHandle, open } from 'fs/promises';

import Configuration, { ReaderOptions } from './configuration';

class BufferedFileReader {
  /**
   * The reader configuration
   */
  readonly #configuration: Configuration;

  /**
   * The path to the target file
   */
  readonly #filePath: string;

  /**
   * The file handle
   */
  #handle: FileHandle | undefined;

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
  public static create(
    filePath: string,
    options?: ReaderOptions,
  ): AsyncGenerator<Buffer, null, Buffer> {
    const config = new Configuration(options ?? {});
    return new BufferedFileReader(filePath, config).start();
  }

  /**
   * Starts reading the file
   *
   * @returns  The iterator
   */
  public async *start(): AsyncGenerator<Buffer, null, Buffer> {
    try {
      if (!this.#handle) await this.#openFileHandle();
      let next: Buffer | null = null;

      do {
        // Get the next chunk
        next = this.#configuration.separator
          ? await this.#readChunkToSeparator(
              this.#configuration.chunkSize,
              this.#configuration.separator,
              this.#cursorPosition,
            )
          : await this.#readChunk(
              this.#configuration.chunkSize,
              this.#cursorPosition,
            );

        // Done
        if (next == null) return null;

        // Update the cursor position
        // For the next iteration
        this.#cursorPosition += next.length;

        // Trim the separator if necessary
        if (
          this.#configuration.separator &&
          this.#configuration.trimSeparator
        ) {
          next = this.#trimSeparator(next, this.#configuration.separator);
        }

        yield next;
      } while (next != null);
    } finally {
      await this.#closeFileHandle();
    }

    return null;
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
    if (res.bytesRead == 0) return null;
    return res.buffer.subarray(0, res.bytesRead);
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
}

export default BufferedFileReader;
