const path = require('path');
const { exec } = require('child_process');
const logger = require('./logger');
const { version } = require('../package.json');

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
  return logger.note(version);
}

const showHelpText = () => {
  logger.note(`Soprox ${version}`)
  logger.info('Usage: soprox -n <project_name> [options]');
  logger.log('Options:');
  logger.log('\t-n, --name: your project name');
  logger.log('\t-t, --template: (🧪 still in labs) choose a template, hello-world as default');
  logger.log('\t-g, --git: (🧪 still in labs) add your git repo');
  logger.log('\t-f, --force: even though the project name has existed, overwrite the program anyway');
  logger.log('\t-v, --version: show version');
  logger.log('\t-h, --help: show help text');
  exit();
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

const exit = () => {
  process.exit(1);
}

module.exports = {
  isIgnored, showVersion, showHelpText, addGit,
  exit,
}