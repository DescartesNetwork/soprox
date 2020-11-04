const types = require('./index');

/**
 * Array
 */

class array {
  constructor(type, value = []) {
    this.value = value;
    this.type = type;

    const { primaryType, len } = this._parseType(this.type);
    this._primaryType = primaryType;
    this._primarySpace = (new types[this._primaryType]).space;
    this._len = len;

    this.space = this._primarySpace * this._len;
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
    if (!types[primaryType]) throw new Error('Invalid type array');
    try { len = parseInt(len) } catch (er) { len = 0 }
    if (len <= 0) throw new Error('Invalid type array');
    return { primaryType, len }
  }

  toBuffer = () => {
    const eleBufs = this.value.map(item => new types[this._primaryType](item));
    return types.pack(...eleBufs);
  }

  fromBuffer = (buf) => {
    if (!Buffer.isBuffer(buf)) throw new Error('Invalid buffer');
    this.value = [];
    let offset = 0;
    while (offset < this.space) {
      const type = new types[this._primaryType]();
      type.fromBuffer(buf.slice(offset, offset + this._primarySpace));
      this.value.push(type.value);
      offset += this._primarySpace;
    }
  }
}

module.exports = { array }