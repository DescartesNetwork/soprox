const { Account, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const soproxABI = require('soprox-abi');
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
    const { address, data: prevData } = config;
    if (Buffer.from(data).toString('hex') != prevData) break history;
    console.log('The program has been loaded at:', address);
    const program = {
      publicKey: new PublicKey(address),
      ...config
    }
    return program;
  }

  // Load the program
  const _program = await deployProgram(data, payer, connection);
  const address = _program.publicKey.toBase58();
  console.log('Deploying the program:', address);

  // Save this info for next time
  let program = {
    address,
    secretKey: Buffer.from(_program.secretKey).toString('hex'),
    data: Buffer.from(data).toString('hex')
  }
  store.save(filename, program);
  program.publicKey = _program.publicKey;
  return program;
}

/**
 * Load registers
 */
loadRegisters = async (schema, payer, program, connection) => {
  const filename = 'abi';
  const data = store.load(filename);

  const { programAddress, schema: storedSchema } = data || {};
  if (programAddress == program.address && storedSchema)
    return storedSchema.map(register => {
      register.publicKey = new PublicKey(program.address);
      return register;
    });

  const layout = await Promise.all(schema.map(async each => {
    const space = soproxABI.span(each);
    const account = await deployRegister(space, payer, program.publicKey, connection);
    each.address = account.publicKey.toBase58();
    each.secretKey = Buffer.from(account.secretKey).toString('hex');
    return each;
  }));
  store.save(filename, {
    programAddress: program.address,
    schema: layout
  });
  return layout.map(register => {
    register.publicKey = new PublicKey(register.address);
    return register;
  });
}


module.exports = { establishPayer, loadProgram, loadRegisters }