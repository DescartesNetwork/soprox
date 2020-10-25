const BufferLayout = require('buffer-layout');


const u32 = name => BufferLayout.struct([
  BufferLayout.blob(4, name)
]);