const BufferLayout = require('buffer-layout');
const BN = require('bn.js');

const bool = name => BufferLayout.blob(1, name);

const char = name => BufferLayout.blob(4, name);

/**
 * Signed integer
 */
class isize extends BN {
  constructor(key, value, type, byteLength) {
    super(value);

    this.key = key;
    this.type = type;
    this.space = byteLength;
    this.buf = BufferLayout.blob(this.space, this.key);
  }

  toBuffer() {
    const a = this.toArray().reverse();
    const b = Buffer.from(a);
    if (b.length > this.space) throw new Error(`${this.type} too large`);
    if (b.length === this.space) return b;
    const zeroPad = Buffer.alloc(this.space);
    b.copy(zeroPad);
    return zeroPad;
  }
}
class i8 extends isize {
  constructor(key, value) {
    super(key, value, 'i8', 1);
  }
}
class i16 extends isize {
  constructor(key, value) {
    super(key, value, 'i16', 2);
  }
}
class i32 extends isize {
  constructor(key, value) {
    super(key, value, 'i32', 4);
  }
}
class i64 extends isize {
  constructor(key, value) {
    super(key, value, 'i64', 8);
  }
}


/**
 * Unsigned integer
 */
class usize extends BN {
  constructor(key, value, type, byteLength) {
    super(value);

    this.key = key;
    this.type = type;
    this.space = byteLength;
    this.buf = BufferLayout.blob(this.space, this.key);
  }

  toBuffer = () => {
    const a = this.toArray().reverse();
    const b = Buffer.from(a);
    if (b.length > this.space) throw new Error(`${this.type} too large`);
    if (b.length === this.space) return b;
    const zeroPad = Buffer.alloc(this.space);
    b.copy(zeroPad);
    return zeroPad;
  }
}

class u8 extends usize {
  constructor(key, value = 0) {
    super(key, value, 'u8', 1);
  }

  static fromBuffer = (buf) => {
    buf = Buffer.from(buf);
    return buf.readInt8();
  }
}
class u16 extends usize {
  constructor(key, value = 0) {
    super(key, value, 'u16', 2);
  }

  static fromBuffer = (buf) => {
    buf = Buffer.from(buf);
    return buf.readInt16LE();
  }
}
class u32 extends usize {
  constructor(key, value = 0) {
    super(key, value, 'u32', 4);
  }

  static fromBuffer = (buf) => {
    buf = Buffer.from(buf);
    return buf.readInt32LE();
  }
}
class u64 extends usize {
  constructor(key, value = 0) {
    super(key, value, 'u64', 8);
  }

  static fromBuffer = (buf) => {
    buf = Buffer.from(buf);
    return buf.readInt64LE();
  }
}

const f32 = name => BufferLayout.blob(3, name);
const f64 = name => BufferLayout.blob(4, name);

layout = (...types) => {
  const dataLayout = BufferLayout.struct(types.map(type => type.buf));
  const reserve = Buffer.alloc(dataLayout.span);
  let data = {}
  types.forEach(type => {
    data[type.key] = type.toBuffer();
  });
  dataLayout.encode(data, reserve);
  return reserve;
}

module.exports = {
  bool,
  char,
  i8, i16, i32, i64,
  u8, u16, u32, u64,
  f32, f64,
  layout,
}