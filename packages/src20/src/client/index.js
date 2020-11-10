const {
  sendAndConfirmTransaction,
  TransactionInstruction,
  Transaction,
  PublicKey
} = require('@solana/web3.js');
const soproxABI = require('soprox-abi');
const { establishConnection, loadPayerFromStore } = require('../../lib/network');
const store = require('../../lib/store');

/**
 * Transfer
 */
const transfer = async (owner, amount, register, programId, payer, connection) => {
  console.log('Transfer', amount, 'TOKEN to', register.id.toBase58());
  const layout = new soproxABI.struct(register.schema, {
    owner,
    amount,
  });
  const code = new soproxABI.u8(3);
  const data = soproxABI.pack(code, layout);
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: register.id, isSigner: false, isWritable: true },
      { pubkey: register.id, isSigner: false, isWritable: true },
    ],
    programId,
    data
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
 * Report balance
 */
const balance = async (register, connection) => {
  const { data } = await connection.getAccountInfo(register.id);
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
    register.id = new PublicKey(register.address);
    return register;
  });
  return { connection, payer, programId, registers }
}

const main = async () => {
  const { connection, payer, programId, registers: [register] } = await init();
  let data = await balance(register, connection);
  console.log('Current data:', data);
  await transfer(data.owner, 1n, register, programId, payer, connection);
  data = await balance(register, connection);
  console.log('New data:', data);
  console.log('Success');
}

try { main() } catch (er) { console.error(er) }
