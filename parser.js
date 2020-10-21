const { exit } = require("process");

function handleError() {
  console.log('usage: soprox <project_name> [options]');
  console.log('\toptions:');
  console.log('\t\t-g, --git: add your git repo');
  console.log('\t\t-f, --force: even though the project name has existed, install program anyway');
  console.log('\t\t-v, --version: show version');
  console.log('\t\t-h, --help: show help text');
  exit(1);
}

function parseKey(key) {
  switch (key) {
    case '-g':
    case '--git':
      return 'git';
    case '-f':
    case '--force':
      return 'force';
    case '-v':
    case '--version':
      return 'version';
    case '-h':
    case '--help':
      return 'help';
    default:
      return handleError();
  }
}

function parse() {
  let params = [...process.argv];
  // Remove node and index as default
  params.shift();
  params.shift();
  // Extract the project name
  if (!params.length) return handleError();
  let data = { name: params.shift() };
  // Extract options
  while (params.length) {
    let key = parseKey(params.shift());
    if (!key) throw new Error('Invalid syntax');
    try {
      data[key] = params.shift();
    } catch (er) {
      return handleError();
    }
  }
  return data;
}

module.exports = { parse }