const bool = require('./bool');
const char = require('./char');
const usize = require('./usize');
const isize = require('./isize');
const types = { ...bool, ...char, ...usize, ...isize };
const util = require('../util');

/**
 * Tuple
 */
class tuple {
  constructor(type, value = []) {
    this.type = type;
    this.value = value;
    const { primaryTypes, space } = this._parseType(this.type);
    this._primaryTypes = primaryTypes;
    this.space = space;
  }

  _parseType = (type) => {
    if (!type) throw new Error('Invalid type tuple');
    if (typeof type !== 'string') throw new Error('Invalid type tuple');
    type = type.trim();
    type = type.split('');
    if (type.shift() !== '(') throw new Error('Invalid type tuple');
    if (type.pop() !== ')') throw new Error('Invalid type tuple');
    type = type.join('');
    let primaryTypes = type.split(';');
    if (primaryTypes.length <= 0) throw new Error('Invalid type tuple');
    let space = 0;
    primaryTypes.forEach(primaryType => {
      if (!types[primaryType]) throw new Error('Invalid type array');
      space += (new types[primaryType]()).space;
    });
    return { primaryTypes, space };
  }

  toBuffer = () => {
    const eleBufs = this._primaryTypes.map((type, i) => new types[type](this.value[i]));
    return util.pack(...eleBufs);
  }

  fromBuffer = (buf) => {
    if (!Buffer.isBuffer(buf)) throw new Error('Invalid buffer');
    this.value = [];
    let offset = 0;
    this._primaryTypes.forEach(primaryType => {
      const type = new types[primaryType]();
      type.fromBuffer(buf.slice(offset, offset + type.space));
      this.value.push(type.value);
      offset += type.space;
    });
  }
}

module.exports = { tuple }