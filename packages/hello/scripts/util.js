const { Account, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const BufferLayout = require('buffer-layout');
const { deployProgram, deployRegister } = require('../helpers/network');
const store = require('../helpers/store');


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
async function loadProgram(data, payer, connection) {
  const filename = 'program.json';
  // Check if the program has already been loaded
  let config = store.load(filename);
  history: if (config) {
    const [{ program: { id, data: prevData } }] = config;
    if (Buffer.from(data).toString('hex') != prevData) break history;
    console.log('The program has been loaded at:', id);
    return config;
  }

  // Load the program
  const program = await deployProgram(data, payer, connection);
  const programId = program.publicKey;
  console.log('Deploying the program:', programId.toBase58());

  // Create the greeted account
  const space = greeterDataLayout.span;
  const greeter = await deployRegister(space, payer, program, connection);
  const greeterId = greeter.publicKey;
  console.log('Creating a register:', greeterId.toBase58());

  // Save this info for next time
  config = [
    {
      program: {
        id: programId.toBase58(),
        name: 'hello',
        data: Buffer.from(data).toString('hex')
      }
    },
    {
      register: {
        id: greeterId.toBase58(),
        name: 'numGreets',
        types: 'uint32',
        bytes: space
      }
    }
  ]
  store.save(filename, config);
  return config;
}


module.exports = { establishPayer, loadProgram }