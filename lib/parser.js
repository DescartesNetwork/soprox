const { showHelpText } = require('./util');

function parseKey(key) {
  switch (key) {
    case '-n':
    case '--name':
      return { key: 'name', type: 'string' };
    case '-t':
    case '--template':
      return { key: 'force', type: 'string' };
    case '-g':
    case '--git':
      return { key: 'git', type: 'string' };
    case '-f':
    case '--force':
      return { key: 'force', type: 'bool' };
    case '-v':
    case '--version':
      return { key: 'version', type: 'bool' };
    case '-h':
    case '--help':
      return { key: 'help', type: 'bool' };
    default:
      return showHelpText();
  }
}

function parse() {
  let params = [...process.argv];
  // Remove node and index as default
  params.shift();
  params.shift();
  // Extract options
  let data = {}
  while (params.length) {
    let { key, type } = parseKey(params.shift());
    if (!key || !type) throw new Error('Invalid syntax');
    if (type === 'bool') {
      data[key] = true;
      continue;
    }
    else if (type === 'string') {
      try {
        data[key] = params.shift();
      } catch (er) {
        return showHelpText();
      }
    }
    else {
      return showHelpText();
    }
  }
  return data;
}

module.exports = { parse }