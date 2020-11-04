/**
 * Unsigned integer
 */
class usize {
  constructor(value, type, byteLength) {
    this.value = value;
    this.type = type;
    this.space = byteLength;
  }

  toBuffer = () => {
    const buf = Buffer.allocUnsafe(this.space);
    buf.writeUIntLE(this.value, 0, this.space);
    return buf;
  }

  fromBuffer = (buf) => {
    if (!Buffer.isBuffer(buf)) throw new Error('Invalid buffer');
    this.value = buf.readUIntLE(0, this.space);
    return this.value;
  }
}

class u8 extends usize {
  constructor(value = 0) {
    super(value, 'u8', 1);
  }
}

class u16 extends usize {
  constructor(value = 0) {
    super(value, 'u16', 2);
  }
}

class u32 extends usize {
  constructor(value = 0) {
    super(value, 'u32', 4);
  }
}

class u64 extends usize {
  constructor(value = 0) {
    super(value, 'u64', 8);
  }
}

module.exports = { u8, u16, u32, u64 }