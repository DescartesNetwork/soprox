/**
 * Character (UTF8)
 */
class char {
  constructor(value) {
    this.value = value;
    this.type = 'char';
    this.space = 4;
  }

  toBuffer = () => {
    const buf = Buffer.allocUnsafe(this.space);
    buf.writeUIntLE(this.value, 0, this.space);
    return buf;
  }

  fromBuffer = (buf) => {
    buf = Buffer.from(buf);
    this.value = buf.readUIntLE(0, this.space);
    return this.value;
  }
}

module.exports = { char }