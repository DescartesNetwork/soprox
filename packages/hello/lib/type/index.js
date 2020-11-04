const { bool } = require('./bool');
const { char } = require('./char');
const { u8, u16, u32, u64 } = require('./usize');
const { i8, i16, i32, i64 } = require('./isize');
const { array } = require('./array');
const { tuple } = require('./tuple');

pack = (...types) => {
  return Buffer.concat(types.map(type => type.toBuffer()));
}

unpack = (data, layout) => {
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

module.exports = {
  bool,
  char,
  i8, i16, i32, i64,
  u8, u16, u32, u64,
  array,
  tuple,
  pack, unpack,
}