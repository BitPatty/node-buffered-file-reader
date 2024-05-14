import { IteratorResult } from './src';

/**
 * Set the timeout for all jest tests
 * and hooks to two minutes
 */
jest.setTimeout(120000);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line
    interface Matchers<R> {
      toMatchChunks(expected: string[]): jest.CustomMatcherResult;
    }
  }
}

expect.extend({
  toMatchChunks(
    received: IteratorResult[],
    expected: string[],
  ): jest.CustomMatcherResult {
    const a = received.map((c) => c.data.toString('hex')).join('-');
    const b = expected.map((e) => Buffer.from(e).toString('hex')).join('-');

    const isMatch = a === b;

    return {
      pass: isMatch,
      message: () =>
        isMatch ? '' : `Chunks don't match\nExpected: ${b}\nGot: ${a}`,
    };
  },
});

export default undefined;
