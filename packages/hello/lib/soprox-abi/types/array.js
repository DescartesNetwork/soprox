const bool = require('./bool');
const char = require('./char');
const usize = require('./usize');
const isize = require('./isize');
const types = { ...bool, ...char, ...usize, ...isize };
const util = require('../util');

/**
 * Array
 */

class array {
  constructor(type, value = []) {
    this.value = value;
    this.type = type;
    const { primaryType, space } = this._parseType(this.type);
    this._primaryType = primaryType;
    this.space = space;
  }

  _parseType = (type) => {
    if (!type) throw new Error('Invalid type array');
    if (typeof type !== 'string') throw new Error('Invalid type array');
    type = type.trim();
    type = type.split('');
    if (type.shift() !== '[') throw new Error('Invalid type array');
    if (type.pop() !== ']') throw new Error('Invalid type array');
    type = type.join('');
    let [primaryType, len] = type.split(';');
    if (!primaryType || !len) throw new Error('Invalid type array');
    if (!types[primaryType]) throw new Error('Invalid type array');
    try { len = parseInt(len) } catch (er) { len = 0 }
    if (len <= 0) throw new Error('Invalid type array');
    const space = (new types[primaryType]).space * len;
    return { primaryType, space }
  }

  toBuffer = () => {
    const eleBufs = this.value.map(item => new types[this._primaryType](item));
    return util.pack(...eleBufs);
  }

  fromBuffer = (buf) => {
    if (!Buffer.isBuffer(buf)) throw new Error('Invalid buffer');
    this.value = [];
    let offset = 0;
    while (offset < this.space) {
      const type = new types[this._primaryType]();
      type.fromBuffer(buf.slice(offset, offset + type.space));
      this.value.push(type.value);
      offset += type.space;
    }
  }
}

module.exports = { array }