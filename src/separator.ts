export const Separator = {
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
