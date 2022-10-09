# Buffered File Reader

A NodeJS library for reading a file in buffered chunks, allowing you to await the processing of a chunk before reading the next one.

## Usage

```typescript
import createReader from '@bitpatty/buffered-file-reader';

// Create the reader instance for the target file
const reader = createReader('path-to-your-file');

for (
  let chunk = await reader.next();
  !chunk.done;
  chunk = await reader.next()
) {
  // Do something with chunk.value
}
```

The chunk value is passed as a [`NodeJS Buffer`](https://nodejs.org/api/buffer.html).

## ConfigurationOptions

The following options can be passed as second argument when instantiating the reader:

```typescript
{
  // The offset (in Bytes) from which to start reading the file
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
