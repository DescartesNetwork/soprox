const types = require('./types');
const util = require('./util');

const create = (type, value = null) => {
  if (types[type]) return new types[type](value);
  const temp = type.split('');
  const boundary = [temp[0], temp[temp.length - 1]].join('');
  if (boundary === '[]') return new types.array(type);
  if (boundary === '()') return new types.tuple(type);
  throw new Error('Invalid type');
}

const span = (register) => {
  const { type, schema } = register;
  if (type) return create(type).space;
  return schema.reduce((total, nestedRegister) => {
    return span(nestedRegister) + total;
  }, 0);
}

class struct {
  constructor(schema, value = {}) {
    this.schema = schema;
    this.value = value;
    this.space = span({ schema: this.schema });
  }

  toBuffer = () => {
    const eleBufs = this.schema.map(each => {
      const { key, type, schema } = each;
      return type ?
        create(type, this.value[key]) :
        new struct(schema, this.value[key]);
    });
    return util.pack(...eleBufs);
  }

  fromBuffer = (buf) => {
    if (!Buffer.isBuffer(buf)) throw new Error('Invalid buffer');
    this.value = {};
    let offset = 0;
    this.schema.forEach(each => {
      const { key, type, schema } = each;
      const item = type ? create(type) : new struct(schema);
      const subBuf = buf.slice(offset, offset + item.space);
      item.fromBuffer(subBuf);
      this.value[key] = item.value;
      offset += item.space;
    });
    return this.value;
  }
}

module.exports = { struct, ...types, ...util, create, span };