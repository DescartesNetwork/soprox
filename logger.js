// Colorized logger
module.exports = {
  log: console.log,
  info: function (...argv) {
    return console.log('\x1b[36m%s\x1b[0m', ...argv, '\x1b[0m');
  },
  note: function (...argv) {
    return console.log('\x1b[35m%s\x1b[0m', ...argv, '\x1b[0m');
  },
  error: function (...argv) {
    return console.log('\x1b[31m%s\x1b[0m', ...argv, '\x1b[0m');
  },
  warn: function (...argv) {
    return console.log('\x1b[33m%s\x1b[0m', ...argv, '\x1b[0m');
  },
}
