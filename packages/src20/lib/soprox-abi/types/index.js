const { bool } = require('./bool');
const { char } = require('./char');
const { u8, u16, u32, u64 } = require('./usize');
const { i8, i16, i32, i64 } = require('./isize');
const { array } = require('./array');
const { tuple } = require('./tuple');
const { pub } = require('./pub');

module.exports = {
  bool,
  char,
  i8, i16, i32, i64,
  u8, u16, u32, u64,
  array,
  tuple,
  pub,
};