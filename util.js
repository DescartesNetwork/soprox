const path = require('path');
const { exec } = require('child_process');
const logger = require('./logger');
const package = require('./package.json');

const isChildOf = (child, parent) => {
  if (child === parent) return true;
  const relative = path.relative(parent, child);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

const isIgnored = (ignores, name) => {
  let ignored = false;
  ignores.forEach(ignore => {
    ignored = ignored || isChildOf(name, ignore);
  });
  return ignored;
}

const showVersion = () => {
  return logger.note(package.version);
}

const showHelpText = () => {
  logger.note(`Soprox ${package.version}`)
  logger.info('Usage: soprox -n <project_name> [options]');
  logger.log('Options:');
  logger.log('\t-n, --name: your project name');
  logger.log('\t-g, --git: (🧪 not yet) add your git repo');
  logger.log('\t-f, --force: even though the project name has existed, overwrite the program anyway');
  logger.log('\t-v, --version: show version');
  logger.log('\t-h, --help: show help text');
  process.exit(1);
}

const addGit = (git, dir, callback) => {
  if (!git) return callback();
  const child = exec('echo "The function is still in labs"', { cwd: dir }, (er, stdout, stderr) => {
    if (er) return callback(er);
    return callback();
  });
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
}

module.exports = { isIgnored, showVersion, showHelpText, addGit }