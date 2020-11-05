/**
 * Supportive functions
 */
const type2Write = (type) => {
  switch (type) {
    case 'i8':
      return 'writeInt8';
    case 'i16':
      return 'writeInt16LE';
    case 'i32':
      return 'writeInt32LE';
    case 'i64':
      return 'writeBigInt64LE';
    default:
      throw new Error('Invalid type');
  }
}

const type2Read = (type) => {
  switch (type) {
    case 'i8':
      return 'readInt8';
    case 'i16':
      return 'readInt16LE';
    case 'i32':
      return 'readInt32LE';
    case 'i64':
      return 'readBigInt64LE';
    default:
      throw new Error('Invalid type');
  }
}

/**
 * Signed integer
 */
class isize {
  constructor(value, type, byteLength) {
    this.value = value;
    this.type = type;
    this.space = byteLength;
  }

  toBuffer = () => {
    const buf = Buffer.allocUnsafe(this.space);
    buf[type2Write(this.type)](this.value);
    return buf;
  }

  fromBuffer = (buf) => {
    if (!Buffer.isBuffer(buf)) throw new Error('Invalid buffer');
    this.value = buf[type2Read(this.type)]();
    return this.value;
  }
}

class i8 extends isize {
  constructor(value = 0) {
    super(value, 'i8', 1);
  }
}

class i16 extends isize {
  constructor(value = 0) {
    super(value, 'i16', 2);
  }
}

class i32 extends isize {
  constructor(value = 0) {
    super(value, 'i32', 4);
  }
}

class i64 extends isize {
  constructor(value = 0) {
    super(value, 'i64', 8);
  }
}

module.exports = { i8, i16, i32, i64 }