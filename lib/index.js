#!/usr/bin/env node
require('regenerator-runtime/runtime');

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const fsx = require('fs-extra');
const rimraf = require('rimraf');
const ora = require('ora');
const logger = require('./logger');
const parser = require('./parser');
const { airdrop, createPayer } = require('./solana');
const { isIgnored, showVersion, showHelpText, addGit } = require('./util');

const main = () => {
  // Parse params
  const params = parser.parse();
  const PACKAGES = `../packages/${params.template}`;
  const IGNORES = [
    path.join(__dirname, PACKAGES, 'dist'),
    path.join(__dirname, PACKAGES, 'node_modules'),
    path.join(__dirname, PACKAGES, 'store'),
  ]

  // Version
  if (typeof params.version != 'undefined') return showVersion();
  // Help text
  if (typeof params.help != 'undefined') return showHelpText();
  // Airdrop
  if (typeof params.airdrop != 'undefined') return airdrop(params.airdrop);
  // Create payer
  if (typeof params.payer != 'undefined') return createPayer(params.payer);

  // Main
  logger.info('\n👏👏👏 Thank you for using SoproX!\n');
  const dir = path.join(process.cwd(), params.name);
  // Create project folder
  if (fs.existsSync(dir)) {
    if (!params.force) return logger.error('Your project that already existed. Please change another name and try again!');
  }
  else fs.mkdirSync(dir);
  // Import project
  const spinner = ora({ color: 'yellow', text: 'Loading magic...\n' }).start();
  spinner.terminate = (ok) => {
    if (ok) return spinner.succeed('Yay, Downloaded magic!\n');
    logger.error('Some errors has occured.\n');
    return spinner.stop('Fail!');
  }
  return fsx.copy(path.join(__dirname, PACKAGES), dir, {
    filter: function (src, dst) {
      return !isIgnored(IGNORES, src);
    }
  }, (er) => {
    if (er) return rimraf(dir, () => spinner.terminate(false));

    spinner.terminate(true);
    return addGit(params.git, dir, (er) => {
      if (er) return logger.error(er);

      const child = exec('npm install', { cwd: dir }, (er, stdout, stderr) => {
        if (er) return logger.error(er);
        return logger.note('Done! Happy coding. 👐\n');
      });
      child.stdout.pipe(process.stdout);
      child.stderr.pipe(process.stderr);
    });
  });
}

/**
 * Run tool
 */
main();