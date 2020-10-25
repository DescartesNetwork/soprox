const { Account, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const BufferLayout = require('buffer-layout');
const {
  loadPayerFromStore, savePayerToStore,
  deployProgram, deployRegister,
} = require('../lib/network');
const store = require('../lib/store');

/**
 * Sync sleep
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Devnet airdrop
 */
const airdrop = async (connection, account, lamports = 100 * LAMPORTS_PER_SOL) => {
  let retries = 10;
  const accountId = account.publicKey;
  await connection.requestAirdrop(accountId, lamports);
  while (retries > 0) {
    await sleep(500);
    if (lamports == await connection.getBalance(accountId)) return lamports;
    console.log('Airdrop retry ' + retries);
    retries -= 1;
  }
  throw new Error(`Airdrop of ${lamports} failed`);
}

/**
 * GreeterDataLayout
 */
const greeterDataLayout = BufferLayout.struct([
  BufferLayout.u32('numGreets'),
]);

/**
 * Establish an account to pay for everything
 */
async function establishPayer(connection) {
  let payer = loadPayerFromStore();
  if (payer) return payer;
  payer = new Account();
  await airdrop(connection, payer);
  savePayerToStore(payer);
  return payer;
}

/**
 * Load the hello world BPF program if not already loaded
 */
async function loadProgram(data, payer, connection) {
  const filename = 'program';
  // Check if the program has already been loaded
  const config = store.load(filename);
  history: if (config) {
    const { id, data: prevData } = config;
    if (Buffer.from(data).toString('hex') != prevData) break history;
    console.log('The program has been loaded at:', id);
    return new PublicKey(id);
  }

  // Load the program
  const program = await deployProgram(data, payer, connection);
  const adress = program.publicKey.toBase58();
  console.log('Deploying the program:', adress);

  // Save this info for next time
  store.save(filename, {
    id: adress,
    name: 'hello',
    data: Buffer.from(data).toString('hex')
  });
  return program.publicKey;
}

/**
 * Load registers
 */
loadRegisters = async (payer, programId, connection) => {
  const filename = 'registers';
  let config = store.load(filename);
  if (config) return config.map(({ id, name }) => ({ id: new PublicKey(id), name }));

  // Create the greeted account
  const space = greeterDataLayout.span;
  const greeter = await deployRegister(space, payer, programId, connection);
  const address = greeter.publicKey.toBase58();
  console.log('Creating a register:', address);

  // Save this info for next time
  config = [
    {
      id: address,
      name: 'numGreets',
      types: 'uint32',
      bytes: space
    }
  ]
  store.save(filename, config);
  return config.map(({ id, name }) => ({ id: new PublicKey(id), name }));
}


module.exports = { establishPayer, loadProgram, loadRegisters }