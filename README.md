# Buffered File Reader

A NodeJS library for reading a file in buffered chunks, allowing you to await the processing of a chunk before reading the next one.

## Usage

The library by default exports a function that instantiates a `BufferedFileReader` and returns its [generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*) function. The base skeleton for use within an application could look as follows:

```typescript
import createReader from '@bitpatty/buffered-file-reader';

// Create the reader instance for the target file
const reader = createReader('path-to-your-file');

for (
  let chunk = await reader.next();
  !chunk.done;
  chunk = await reader.next()
) {
  // Do something with chunk.value.data
}
```

### Chunk Value

The chunk value is passed in the format below - whereas `Buffer` is a [`NodeJS Buffer`](https://nodejs.org/api/buffer.html). The typing of the iterator and its result can also be imported from the library as follows: `import { Iterator, IteratorResult } from '@bitpatty/buffered-file-reader'`. Note: There is a builtin `IteratorResult` type in NodeJS, make sure you import it from the library if you intend to use it.

```typescript
type IteratorResult = {
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
```

### End of file

To know whether the reader reached the end of the file (no more to read), you can either check whether the value is `null` or whether the `done` flag is set:

```typescript
const chunkA = await reader.next();
if (chunkA.value == null) console.log('done');

// .. or ..
const chunkA = await reader.next();
if (chunkA.done) console.log('done');
```

### Exiting early

> Note: If you don't read the whole file you should always call the return function to close the open handles.

If you want to stop further reads you can call `return` on the reader:

```typescript
import createReader from '@bitpatty/buffered-file-reader';

// Create the reader instance for the target file
const reader = createReader('path-to-your-file');

// ...

reader.return(null);
```

## Configuration Options

The following options can be passed as second argument when instantiating the reader:

```typescript
{
  // The offset (in Bytes) from which to start reading the file
  //
  // If set to a number greater than 0, that number of bytes
  // will be skipped when reading the first chunk.
  //
  // Defaults to `0`
  startOffset: 123;

  // The default chunk size of the reader.
  //
  // If provided, the specified number of bytes is read on each
  // read operation. If no separator is configured, this will
  // also be the size of the buffer returned on each iteration.
  //
  // Note that when the reader reaches the end of the file,
  // the buffer size may be less than the chunk size.
  //
  // Defaults to `100`
  chunkSize: 100;

  //
  // Whether to fail if the file is modified while its being
  // processed by the file reader.
  //
  // If set to `true`, the file will be tracked for changes
  // by `watchFile`. If any changes are done to the file
  // the following read will throw an error.
  //
  // See: https://nodejs.org/docs/latest/api/fs.html#fs_fs_watchfile_filename_options_listener
  //
  // Defaults to `true`.
  //
  throwOnFileModification: boolean;

  // The interval of file modification checks in milliseconds.
  //
  // The interval specifies at which rate the file stats should
  // be checked for any modifications.
  //
  // Note that the actual detection frequency is still relying
  // on the NodeJS file watcher.
  //
  // Defaults to `1000`
  //
  fileModificationPollInterval: number;

  // The byte pattern to identify the end of a section.
  //
  // If provided, the reader continues to read bytes into the buffer
  // until it encounters the separator and continues reading from
  // the end of the separator during the next iteration.
  //
  // This is especially useful when dealing with text files with
  // a delimiter (such as newlines). Note that the chunk size
  // configuration still applies for read operations. However,
  // the returned buffer size may be lower or higher than the
  // configured size, depending on where it encounters the
  // separator pattern.
  //
  // Defaults to `undefined`
  separator: new Uint8Array([0x01, 0x02, 0x03]);

  // Whether the encountered separator should be trimmed from
  // The returned buffer. This configuration is ignored if no
  // separator is specified.
  //
  // If this is set to true the separator will be removed from
  // the end of the buffer before being returned as result of
  // the current iteration, else it is kept in the buffer.
  //
  // E.g. The file 0x12345678 with the separator 0x56 will return
  //      0x1234 if this is set to `true`, else it will return
  //      0x123456.
  //
  // Defaults to `false`
  trimSeparator: true;
}
```

### Separators

The library provides a set of separators signatures which you can provide in the `separator` configuration (see example below). Note that you can always define your own separator by passing an `Uint8Array`.

```typescript
import createReader, { Separator } '@bitpatty/buffered-file-reader'

// Create the reader instance for the target file
const reader = createReader('path-to-your-file', {
  separator: Separator.CRLF
});

```

The following separators are available within the library itself:

```typescript
const Separator = {
  /**
   * Matches the carriage return character `\r`
   */
  CR: new Uint8Array([0x0d]),
  /**
   * Matches the newline character `\n`
   */
  LF: new Uint8Array([0x0a]),
  /**
   * Matches the carriage return newline characters `\r\n`
   */
  CRLF: new Uint8Array([0x0d, 0x0a]),
  /**
   * Matches the NULL terminator `\0`
   */
  NULL_TERMINATOR: new Uint8Array([0x00]),
};
```

## Examples

This section provides a few examples on how the library can be used.

### Reading a text file line by line

The following snippet reads a text file containing lines separated with a newline character `\n`.

> Note that since the separator is a new line character (`\n`) and you choose to trim the separator
> a potential carriage return (`\r`) is not trimmed.

```typescript
// my-file.txt:
// lorem ipsum
// dolor sit amet

import createReader, { Separator } from '@bitpatty/buffered-file-reader';

const reader = createReader('my-file.txt', {
  separator: Separator.LF,
  trimSeparator: true,
});

const line1 = await reader.next();
const line2 = await reader.next();
const line3 = await reader.next();

console.log(line1.value.data.toString()); // lorem ipsum
console.log(line2.value.data.toString()); // dolor sit amet
```

### Reading a binary file byte by byte

The following snippet reads a binary file byte-by-byte

```typescript
// my-file.bin:
// 0x001122

import createReader, { Separator } from '@bitpatty/buffered-file-reader';

const reader = createReader('my-file.txt', { chnkSize: 1 });

const byte1 = await reader.next();
const byte2 = await reader.next();
const byte3 = await reader.next();
const byte4 = await reader.next();

console.log(byte1.value.data); // <Buffer 00>
console.log(byte2.value.data); // <Buffer 11>
console.log(byte3.value.data); // <null>
console.log(byte4.value.data); // <undefined>
```
