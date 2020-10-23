const { Account, PublicKey, BpfLoader, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const fs = require('fs');
const BufferLayout = require('buffer-layout');
const { urlTls } = require('../helpers/url');
const { deployProgram, deployRegister } = require('../helpers/network');
const store = require('../helpers/store');

const pathToProgram = './dist/program/main.so';

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
  const filename = 'payer.json';
  const data = store.load(filename);
  if (data) {
    const { privateKey } = data;
    return new Account(Buffer.from(privateKey, 'hex'));
  }
  const payer = new Account();
  await airdrop(connection, payer);
  store.save(filename, {
    address: payer.publicKey.toBase58(),
    privateKey: Buffer.from(payer.secretKey).toString('hex')
  });
  return payer;
}

/**
 * Load the hello world BPF program if not already loaded
 */
async function loadProgram(payer, connection) {
  const filename = 'program.json';
  // Check if the program has already been loaded
  let config = store.load(filename);
  if (config) {
    const [
      { program: { id: _programId } },
      { register: { id: _greeterId, bytes, type } },
    ] = config;
    const programId = new PublicKey(_programId);
    const greeterId = new PublicKey(_greeterId);
    return { programId, greeterId }
  }

  // Load the program
  console.log('Loading program...');
  const data = fs.readFileSync(pathToProgram);
  const program = await deployProgram(data, payer, connection);
  const programId = program.publicKey;
  console.log('Program loaded to account', programId.toBase58());

  // Create the greeted account
  const space = greeterDataLayout.span;
  const greeter = await deployRegister(space, payer, program, connection);
  const greeterId = greeter.publicKey;
  console.log('Creating account', greeterId.toBase58(), 'to say hello to');

  // Save this info for next time
  store.save(filename, [
    {
      program: {
        id: programId.toBase58()
      }
    },
    {
      register: {
        id: greeterId.toBase58(),
        types: 'uint32',
        bytes: space
      }
    }
  ]);
  return { programId, greeterId }
}


module.exports = { establishPayer, loadProgram }