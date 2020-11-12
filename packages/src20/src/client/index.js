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
const tokenConstructor = async (totalSupply, decimals, token, register, programId, payer, connection) => {
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
      { pubkey: token.publicKey, isSigner: true, isWritable: true },
      { pubkey: register.publicKey, isSigner: false, isWritable: true },
    ],
    programId,
    data: layout.toBuffer()
  });
  const transaction = new Transaction();
  transaction.add(instruction);
  const signer = new Account(Buffer.from(token.secretKey, 'hex'));
  await sendAndConfirmTransaction(
    connection, transaction, [payer, signer],
    {
      skipPreflight: true,
      commitment: 'recent',
    });
}

/**
 * Transfer ownership
 */
const transferOwnership = async (newOwner, register, programId, payer, connection) => {
  console.log('TransferOnwership to', newOwner.toBase58(), 'of', register.publicKey.toBase58());
  const schema = [
    { key: 'code', type: 'u8' },
    { key: 'newOwner', type: 'pub' }
  ];
  const layout = new soproxABI.struct(schema, {
    code: 1,
    newOwner: newOwner.toBase58(),
  });
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: register.publicKey, isSigner: true, isWritable: true },
    ],
    programId,
    data: layout.toBuffer()
  });
  const transaction = new Transaction();
  transaction.add(instruction);
  const signer = new Account(Buffer.from(register.secretKey, 'hex'));
  await sendAndConfirmTransaction(
    connection, transaction, [payer, signer],
    {
      skipPreflight: true,
      commitment: 'recent',
    });
}


/**
 * Transfer
 */
const transfer = async (amount, token, register, programId, payer, connection) => {
  console.log('Transfer', amount, 'TOKEN to', register.publicKey.toBase58());
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
      { pubkey: token.publicKey, isSigner: false, isWritable: false },
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      { pubkey: register.publicKey, isSigner: false, isWritable: true },
      { pubkey: register.publicKey, isSigner: false, isWritable: true },
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
  const token = registers[0];
  const register = registers[1];
  let data = await info(register, connection);
  console.log('Current data:', data);
  await transferOwnership(
    payer.publicKey,
    register,
    programId,
    payer,
    connection
  );
  await tokenConstructor(
    500000000000000000n,
    8,
    token,
    register,
    programId,
    payer,
    connection
  )
  await transfer(
    1000n,
    token,
    register,
    programId,
    payer,
    connection
  );
  data = await info(register, connection);
  console.log('New data:', data);
  console.log('Success');
}

try { main() } catch (er) { console.error(er) }
