const {
  Account,
  Connection,
  BpfLoader,
  BPF_LOADER_DEPRECATED_PROGRAM_ID,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
  Transaction,
} = require('@solana/web3.js');
const fs = require('fs');
const BufferLayout = require('buffer-layout');
const BN = require('bn.js');

const { url, urlTls } = require('../../url');
const { Store } = require('./helpers/store');
const { newAccountWithLamports, sendAndConfirmTransaction } = require('./helpers/util');

let connection;
let payerAccount;
let programId;
let greetedPubkey;

const pathToProgram = 'dist/program/main.so';

/**
 * Layout of the greeted account data
 */
const greetedAccountDataLayout = BufferLayout.struct([
  BufferLayout.u32('numGreets'),
]);

/**
 * Establish a connection to the cluster
 */
async function establishConnection() {
  connection = new Connection(url, 'recent');
  const version = await connection.getVersion();
  console.log('Connection to cluster established:', url, version);
}

/**
 * Establish an account to pay for everything
 */
async function establishPayer() {
  if (!payerAccount) {
    let fees = 0;
    const { feeCalculator } = await connection.getRecentBlockhash();
    // Calculate the cost to load the program
    const data = fs.readFileSync(pathToProgram);
    const NUM_RETRIES = 500; // allow some number of retries
    fees +=
      feeCalculator.lamportsPerSignature *
      (BpfLoader.getMinNumSignatures(data.length) + NUM_RETRIES) +
      (await connection.getMinimumBalanceForRentExemption(data.length));
    // Calculate the cost to fund the greeter account
    fees += await connection.getMinimumBalanceForRentExemption(
      greetedAccountDataLayout.span,
    );
    // Calculate the cost of sending the transactions
    fees += feeCalculator.lamportsPerSignature * 100; // wag
    // Fund a new payer via airdrop
    payerAccount = await newAccountWithLamports(connection, fees);
  }
  const lamports = await connection.getBalance(payerAccount.publicKey);
  console.log('Using account', payerAccount.publicKey.toBase58(), 'containing', lamports / LAMPORTS_PER_SOL, 'Sol to pay for fees');
}

/**
 * Load the hello world BPF program if not already loaded
 */
async function loadProgram() {
  const store = new Store();
  // Check if the program has already been loaded
  let config = store.load('config.json');
  if (config) {
    programId = new PublicKey(config.programId);
    greetedPubkey = new PublicKey(config.greetedPubkey);
    await connection.getAccountInfo(programId);
    return console.log('Program already loaded to account', programId.toBase58());
  }

  // Load the program
  console.log('Loading hello world program...');
  const data = fs.readFileSync(pathToProgram);
  const programAccount = new Account();
  await BpfLoader.load(
    connection,
    payerAccount,
    programAccount,
    data,
    BPF_LOADER_DEPRECATED_PROGRAM_ID,
  );
  programId = programAccount.publicKey;
  console.log('Program loaded to account', programId.toBase58());

  // Create the greeted account
  const greetedAccount = new Account();
  greetedPubkey = greetedAccount.publicKey;
  console.log('Creating account', greetedPubkey.toBase58(), 'to say hello to');
  const space = greetedAccountDataLayout.span;
  const lamports = await connection.getMinimumBalanceForRentExemption(space);
  let transaction = new Transaction();
  transaction.add(SystemProgram.createAccount({
    fromPubkey: payerAccount.publicKey,
    newAccountPubkey: greetedPubkey,
    lamports,
    space,
    programId,
  }));
  await sendAndConfirmTransaction(
    connection,
    transaction,
    payerAccount,
    greetedAccount,
  );

  // Save this info for next time
  store.save('config.json', {
    url: urlTls,
    programId: programId.toBase58(),
    greetedPubkey: greetedPubkey.toBase58(),
  });
}

/**
 * Say hello
 */
class u32 extends BN {
  toBuffer() {
    const a = super.toArray().reverse();
    const b = Buffer.from(a);
    if (b.length > 4) throw new Error('u64 too large');
    if (b.length === 4) return b;
    const zeroPad = Buffer.alloc(4);
    b.copy(zeroPad);
    return zeroPad;
  }
}
async function sayHello(amount) {
  console.log('Saying hello to', greetedPubkey.toBase58());
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    BufferLayout.blob(4, 'amount'),
  ]);
  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode({ instruction: 0, amount: new u32(amount).toBuffer() }, data);
  const instruction = new TransactionInstruction({
    keys: [{ pubkey: greetedPubkey, isSigner: false, isWritable: true }],
    programId,
    data
  });
  const transaction = new Transaction();
  transaction.add(instruction);
  await sendAndConfirmTransaction(connection, transaction, payerAccount);
}

/**
 * Report the number of times the greeted account has been said hello to
 */
async function reportHellos() {
  const accountInfo = await connection.getAccountInfo(greetedPubkey);
  if (accountInfo === null) {
    throw 'Error: cannot find the greeted account';
  }
  const info = greetedAccountDataLayout.decode(Buffer.from(accountInfo.data));
  console.log(greetedPubkey.toBase58(), 'has been greeted', info.numGreets.toString(), 'times');
}

module.exports = { establishConnection, establishPayer, loadProgram, sayHello, reportHellos }