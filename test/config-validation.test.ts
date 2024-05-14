import { assert } from 'console';
import { statSync } from 'fs';

import createReader from '../src';

import { getTestFilePath } from './test-utils';

const filePath = getTestFilePath('empty-file.bin');
const fileSize = statSync(filePath).size;

assert(fileSize === 0);

describe('Configuration Validation', () => {
  describe('Start Offset', () => {
    test('Negative Throws', () => {
      expect(() => createReader(filePath, { startOffset: -1 })).toThrow();
    });

    test('Zero Does Not Throw', () => {
      expect(() => createReader(filePath, { startOffset: 0 })).not.toThrow();
    });
  });

  describe('Separator', () => {
    test('Empty Throws', () => {
      expect(() =>
        createReader(filePath, { separator: new Uint8Array() }),
      ).toThrow();
    });

    test('Non-Empty Does Not Throw', () => {
      expect(() =>
        createReader(filePath, { separator: new Uint8Array(0x1) }),
      ).not.toThrow();
    });
  });

  describe('Chunk Size', () => {
    test('Negative Throws', () => {
      expect(() => createReader(filePath, { chunkSize: -1 })).toThrow();
    });

    test('Zero Throws', () => {
      expect(() => createReader(filePath, { chunkSize: 0 })).toThrow();
    });

    test('Positive Does Not Throw', () => {
      expect(() => createReader(filePath, { chunkSize: 1 })).not.toThrow();
    });
  });

  describe('Modification Watcher Poll Interval', () => {
    test('Negative Throws', () => {
      expect(() =>
        createReader(filePath, { fileModificationPollInterval: -1 }),
      ).toThrow();
    });

    test('Zero Throws', () => {
      expect(() =>
        createReader(filePath, { fileModificationPollInterval: 0 }),
      ).toThrow();
    });

    test('Less Than 10 Throws', () => {
      expect(() =>
        createReader(filePath, { fileModificationPollInterval: 9 }),
      ).toThrow();
    });

    test('>= 10 Does Not Throw', () => {
      expect(() =>
        createReader(filePath, { fileModificationPollInterval: 10 }),
      ).not.toThrow();
    });
  });
});
