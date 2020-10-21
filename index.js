#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { ncp } = require('ncp');
const rimraf = require('rimraf');
const ora = require('ora');
const logger = require('./logger');
const parser = require('./parser');

const PACKAGES = './packages';

logger.info('\n👏👏👏 Thank you for using SoproX!\n');

// Parse params
const params = parser.parse();
const dir = path.join(process.cwd(), params.name);

// Create project folder
if (fs.existsSync(dir)) return logger.error('Your project that already existed. Please change another name and try again!');
fs.mkdirSync(dir);

// Import project
const spinner = ora({ color: 'yellow', text: 'Loading magic' }).start();
ncp(path.join(__dirname, PACKAGES), dir, function (er) {
  if (er) return rimraf(dir, function () {
    logger.error('Some errors has occured');
    return spinner.stop('Fail!');
  });
  return spinner.succeed('Yay! Happy coding. 👐');
});