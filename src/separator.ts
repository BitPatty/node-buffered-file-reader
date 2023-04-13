const Separator = {
  CR: new Uint8Array([0x0d]),
  LF: new Uint8Array([0x0a]),
  CRLF: new Uint8Array([0x0d, 0x0a]),
  NULL_TERMINATOR: new Uint8Array([0x00]),
};

export default Separator;
