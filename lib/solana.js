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
const establishConnection = async (url = 'http://localhost:8899') => {
  const connection = new Connection(url, 'recent');
  const version = await connection.getVersion();
  logger.info('Connection to cluster established:', url, version);
  return connection;
}

/**
 * Devnet airdrop
 */
const airdrop = async (address, lamports = 100 * LAMPORTS_PER_SOL) => {
  if (!address) throw new Error('Invalid address');
  const connection = await establishConnection();
  let retries = 10;
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
const createPayer = async () => {
  const payer = new Account();
  await airdrop(payer.publicKey.toBase58());
  logger.log('A new payer is created. Details:');
  logger.info('\tAddress:', payer.publicKey.toBase58());
  logger.info('\tPublic key:', payer.publicKey.toBuffer().toString('hex'));
  logger.info('\tSecret key:', Buffer.from(payer.secretKey).toString('hex'));
}

module.exports = { airdrop, createPayer }