const BufferLayout = require('buffer-layout');
const { u8, u16, u32, u64 } = require('./usize');
const { i8, i16, i32, i64 } = require('./isize');

const bool = name => BufferLayout.blob(1, name);

const char = name => BufferLayout.blob(4, name);

const f32 = name => BufferLayout.blob(3, name);
const f64 = name => BufferLayout.blob(4, name);

layout = (...types) => {
  return Buffer.concat(types.map(type => type.toBuffer()));
}

module.exports = {
  bool,
  char,
  i8, i16, i32, i64,
  u8, u16, u32, u64,
  f32, f64,
  layout,
}