import { FileHandle, open } from 'fs/promises';

class BufferedFileReader {
  readonly #filePath: string;
  #handle: FileHandle | undefined;
  #cursorPosition = 0;

  /**
   * Creates a new file reader instance
   *
   * @param filePath  The path to the file
   */
  private constructor(filePath: string) {
    this.#filePath = filePath;
  }

  /**
   * Creates a new bufferd file reader
   *
   * @param filePath  The file path
   * @returns         The file reader
   */
  public static create(filePath: string): AsyncGenerator<Buffer | null> {
    return new BufferedFileReader(filePath).start();
  }

  /**
   * Starts reading the file
   *
   * @returns  The iterator
   */
  public async *start(): AsyncGenerator<Buffer | null> {
    try {
      if (!this.#handle) await this.#openHandle();
      let next: Buffer | null = null;

      do {
        next = await this.#read(1, this.#cursorPosition);
        this.#cursorPosition++;
        yield next;
      } while (next != null);
    } finally {
      await this.#closeHandle();
    }
  }

  /**
   * Opens the file handle
   */
  async #openHandle(): Promise<void> {
    if (this.#handle) throw new Error('Handle already opened');
    this.#handle = await open(this.#filePath);
  }

  /**
   * Reads a portion of the file
   *
   * @param length  The buffer length
   * @param offset  The read offset
   * @returns       The read bytes or NULL if the offset exceeds the file size
   */
  async #read(length: number, offset = 0): Promise<Buffer | null> {
    if (!this.#handle) throw new Error('Handle not opened');
    const buffer = Buffer.alloc(length, 0);
    const res = await this.#handle.read(buffer, 0, length, offset);
    if (res.bytesRead == 0) return null;
    return res.buffer.subarray(0, res.bytesRead);
  }

  /**
   * Closes the file handle
   */
  async #closeHandle(): Promise<void> {
    if (this.#handle == null) return;
    await this.#handle.close();
    this.#handle = undefined;
  }
}

export default BufferedFileReader;
