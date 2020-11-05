const types = require('./types');

const pack = (...items) => {
  return Buffer.concat(items.map(type => type.toBuffer()));
}

const unpack = (data, layout) => {
  let re = {};
  let offset = 0;
  Object.keys(layout).forEach(key => {
    const item = layout[key];
    const buffer = data.slice(offset, offset + item.space);
    item.fromBuffer(buffer);
    re[key] = item.value;
    offset += item.space;
  });
  return re;
}

const create = (type) => {
  if (types[type]) return new types[type]();
  const temp = type.split('');
  const boundary = [temp[0], temp[temp.length - 1]].join('');
  if (boundary === '[]') return new types.array(type);
  if (boundary === '()') return new types.tuple(type);
  throw new Error('Invalid type');
}

const span = (serialization) => {
  return serialization.reduce((total, { type, serialization: nestedSerialization }) => {
    console.log(type)
    if (type === 'struct') return span(nestedSerialization) + total;
    const value = create(type);
    return value.space + total;
  }, 0);
}

module.exports = { types, pack, unpack, create, span };