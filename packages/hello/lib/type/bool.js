/**
 * Boolean
 */
class bool {
  constructor(value) {
    this.value = value;
    this.type = 'bool';
    this.space = 1;
  }

  toBuffer = () => {
    const buf = Buffer.allocUnsafe(this.space);
    buf.writeUIntLE(this.value ? 1 : 0, 0, this.space);
    return buf;
  }

  fromBuffer = (buf) => {
    buf = Buffer.from(buf);
    this.value = Boolean(buf.readUIntLE(0, this.space));
    return this.value;
  }
}

module.exports = { bool }