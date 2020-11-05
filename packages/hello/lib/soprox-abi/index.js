const types = require('./types');
const serialization = require('./serialization');

const create = (type) => {
  if (types[type]) return new types[type]();
  const temp = type.split('');
  const boundary = [temp[0], temp[temp.length - 1]].join('');
  if (boundary === '[]') return new types.array(type);
  if (boundary === '()') return new types.tuple(type);
  throw new Error('Invalid type');
}

const span = (register) => {
  const { type, serialization } = register;
  if (type) return create(type).space;
  return serialization.reduce((total, nestedRegister) => {
    return span(nestedRegister) + total;
  }, 0);
}

module.exports = { types, ...serialization, create, span };