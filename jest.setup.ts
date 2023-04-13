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
    received: Buffer[],
    expected: string[],
  ): jest.CustomMatcherResult {
    const a = received.map((c) => c.toString('hex')).join('-');
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
