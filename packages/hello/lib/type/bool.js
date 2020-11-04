/**
 * Boolean
 */
class bool {
  constructor(value = false) {
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
    if (!Buffer.isBuffer(buf)) throw new Error('Invalid buffer');
    this.value = Boolean(buf.readUIntLE(0, this.space));
    return this.value;
  }
}

module.exports = { bool }