const pack = (...items) => {
  return Buffer.concat(items.map(type => type.toBuffer()));
}

module.exports = { pack }