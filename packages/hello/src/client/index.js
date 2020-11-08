const {
  sendAndConfirmTransaction,
  TransactionInstruction,
  Transaction,
  PublicKey
} = require('@solana/web3.js');
const soproxABI = require('../../lib/soprox-abi');
const { establishConnection, loadPayerFromStore } = require('../../lib/network');
const store = require('../../lib/store');

/**
 * Say hello
 */
const sayHello = async (amount, toggle, register, programId, payer, connection) => {
  console.log('Saying hello to', register.id.toBase58());
  const layout = new soproxABI.struct(register.schema, {
    numGreets: amount,
    toggleState: toggle
  });
  const code = new soproxABI.u8(0);
  const data = soproxABI.pack(code, layout);
  const instruction = new TransactionInstruction({
    keys: [{ pubkey: register.id, isSigner: false, isWritable: true }],
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
 * Report the number of times the greeted account has been said hello to
 */
const reportHello = async (register, connection) => {
  const { data } = await connection.getAccountInfo(register.id);
  if (!data) throw new Error('Cannot find data of', register.address);
  let layout = new soproxABI.struct(register.schema);
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
  console.log("Let's say hello to a Solana account...");
  const { connection, payer, programId, registers: [register] } = await init();
  let data = await reportHello(register, connection);
  console.log('Current data:', data);
  await sayHello(1, !data.toggleState, register, programId, payer, connection);
  data = await reportHello(register, connection);
  console.log('New data:', data);
  console.log('Success');
}

try { main() } catch (er) { console.error(er) }
