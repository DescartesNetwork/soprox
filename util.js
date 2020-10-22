const path = require('path');
const logger = require('./logger');
const package = require('./package.json');

function isChildOf(child, parent) {
  if (child === parent) return true;
  const relative = path.relative(parent, child);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function isIgnored(ignores, name) {
  let ignored = false;
  ignores.forEach(ignore => {
    ignored = ignored || isChildOf(name, ignore);
  });
  return ignored;
}

function getVersion() {
  return package.version;
}

function showHelpText() {
  logger.note(`Soprox ${package.version}`)
  logger.log('Usage: soprox <project_name> [options]');
  logger.log('\toptions:');
  logger.log('\t\t-g, --git: add your git repo');
  logger.log('\t\t-f, --force: even though the project name has existed, overwrite the program anyway');
  logger.log('\t\t-v, --version: show version');
  logger.log('\t\t-h, --help: show help text');
  process.exit(1);
}

module.exports = { isIgnored, getVersion, showHelpText }