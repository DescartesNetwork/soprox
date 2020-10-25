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
    buf.writeIntLE(this.value, 0, this.space);
    return buf;
  }

  fromBuffer = (buf) => {
    buf = Buffer.from(buf);
    this.value = buf.readIntLE(0, this.space);
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