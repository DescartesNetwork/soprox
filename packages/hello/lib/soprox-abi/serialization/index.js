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

module.exports = { pack, unpack }