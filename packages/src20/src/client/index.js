const {
  sendAndConfirmTransaction,
  TransactionInstruction,
  Transaction,
  PublicKey,
  Account,
} = require('@solana/web3.js');
const soproxABI = require('soprox-abi');
const { establishConnection, loadPayerFromStore } = require('../../lib/network');
const store = require('../../lib/store');

/**
 * Token constructor
 */
const tokenConstructor = async (totalSupply, decimals, token, receiver, programId, payer, connection) => {
  console.log('Token contructor at', token.publicKey.toBase58());
  const schema = [
    { key: 'code', type: 'u8' },
    { key: 'totalSupply', type: 'u64' },
    { key: 'demicals', type: 'u8' },
  ];
  const layout = new soproxABI.struct(schema, {
    code: 0,
    totalSupply,
    decimals,
  });
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      { pubkey: token.publicKey, isSigner: true, isWritable: true },
      { pubkey: receiver.publicKey, isSigner: true, isWritable: true },
    ],
    programId,
    data: layout.toBuffer()
  });
  const transaction = new Transaction();
  transaction.add(instruction);
  await sendAndConfirmTransaction(
    connection,
    transaction,
    [
      payer,
      new Account(Buffer.from(token.secretKey, 'hex')),
      new Account(Buffer.from(receiver.secretKey, 'hex'))
    ],
    {
      skipPreflight: true,
      commitment: 'recent',
    });
}

/**
 * Account constructor
 */
const accountConstructor = async (token, account, programId, payer, connection) => {
  console.log('Account constructor at', account.publicKey.toBase58());
  const schema = [
    { key: 'code', type: 'u8' },
  ];
  const layout = new soproxABI.struct(schema, {
    code: 1,
  });
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      { pubkey: token.publicKey, isSigner: false, isWritable: false },
      { pubkey: account.publicKey, isSigner: true, isWritable: true },
    ],
    programId,
    data: layout.toBuffer()
  });
  const transaction = new Transaction();
  transaction.add(instruction);
  await sendAndConfirmTransaction(
    connection,
    transaction,
    [
      payer,
      new Account(Buffer.from(account.secretKey, 'hex'))
    ],
    {
      skipPreflight: true,
      commitment: 'recent',
    });
}


/**
 * Transfer
 */
const transfer = async (amount, token, source, destination, programId, payer, connection) => {
  console.log('Transfer', amount, 'TOKEN to', destination.publicKey.toBase58());
  const schema = [
    { key: 'code', type: 'u8' },
    { key: 'amount', type: 'u64' }
  ];
  const layout = new soproxABI.struct(schema, {
    code: 3,
    amount,
  });
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      { pubkey: token.publicKey, isSigner: false, isWritable: false },
      { pubkey: source.publicKey, isSigner: false, isWritable: true },
      { pubkey: destination.publicKey, isSigner: false, isWritable: true },
    ],
    programId,
    data: layout.toBuffer()
  });
  const transaction = new Transaction();
  transaction.add(instruction);
  await sendAndConfirmTransaction(
    connection, transaction, [payer],
    {
      skipPreflight: true,
      commitment: 'recent',
    });
}

/**
 * Account info
 */
const info = async (register, connection) => {
  const { data } = await connection.getAccountInfo(register.publicKey);
  if (!data) throw new Error('Cannot find data of', register.address);
  const layout = new soproxABI.struct(register.schema);
  layout.fromBuffer(data);
  return layout.value;
}

const init = async () => {
  const connection = await establishConnection();
  const payer = loadPayerFromStore();
  const program = store.load('program');
  const programId = new PublicKey(program.address);
  const registers = store.load('abi').schema.map(register => {
    register.publicKey = new PublicKey(register.address);
    return register;
  });
  return { connection, payer, programId, registers }
}

const main = async () => {
  const { connection, payer, programId, registers } = await init();
  const [token, source, destination] = registers;
  console.log('Current source data:', await info(source, connection));
  console.log('Current destination data:', await info(destination, connection));
  await tokenConstructor(
    500000000000000000n,
    8,
    token,
    source,
    programId,
    payer,
    connection
  )
  await accountConstructor(
    token,
    destination,
    programId,
    payer,
    connection
  )
  await transfer(
    1000n,
    token,
    source,
    destination,
    programId,
    payer,
    connection
  );
  console.log('New source data:', await info(source, connection));
  console.log('New destination data:', await info(destination, connection));
  console.log('Success');
}

try { main() } catch (er) { console.error(er) }
