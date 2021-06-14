const path = require('path');
const fs = require('fs');
const { Connection, PublicKey, Account, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const logger = require('./logger');

/**
 * Async sleeping
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Establish connection
 */
const establishConnection = async (url = 'https://api.devnet.solana.com') => {
  const connection = new Connection(url, 'recent');
  const version = await connection.getVersion();
  logger.info('Connection to cluster established:', url, version);
  return connection;
}

/**
 * Devnet airdrop
 */
const airdrop = async (address, lamports = 10 * LAMPORTS_PER_SOL) => {
  if (!address) throw new Error('Invalid address');
  const connection = await establishConnection();
  let retries = 100;
  const publicKey = new PublicKey(address);
  await connection.requestAirdrop(publicKey, lamports);
  while (retries > 0) {
    await sleep(500);
    const balance = await connection.getBalance(publicKey)
    if (lamports <= balance)
      return logger.log(`Current balance of ${address} is ${balance / LAMPORTS_PER_SOL} SOL`);
    logger.warn('⚠️ Airdrop retry ' + retries);
    retries -= 1;
  }
  return logger.error(`Airdrop of ${lamports / LAMPORTS_PER_SOL} SOL failed`);
}

/**
 * Create a payer
 */
const createPayer = async (secretKey) => {
  const dir = path.join(process.cwd(), './dist');
  const filename = path.join(dir, 'payer-keypair.json');
  let payer = new Account();
  try {
    if (secretKey) {
      payer = new Account(Buffer.from(secretKey, 'hex'));
      throw new Error('Override the current payer');
    } else {
      const payerKey = require(dir);
      payer = new Account(payerKey);
      logger.log('The current payer is loaded. Details:');
    }
  } catch (er) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch (_) { }
    const data = '[' + payer.secretKey.toString() + ']';
    fs.writeFileSync(filename, data, 'utf8');
    await airdrop(payer.publicKey.toBase58());
    logger.log('A new payer is created. Details:');
  }
  logger.info('\tPayer keypair path:', filename);
  logger.info('\tAddress:', payer.publicKey.toBase58());
  logger.info('\tPublic key:', payer.publicKey.toBuffer().toString('hex'));
  logger.info('\tSecret key:', Buffer.from(payer.secretKey).toString('hex'));
}

module.exports = { airdrop, createPayer }