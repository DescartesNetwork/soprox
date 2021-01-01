const {
  sendAndConfirmTransaction,
  TransactionInstruction,
  Transaction,
  PublicKey
} = require('@solana/web3.js');
const soproxABI = require('soprox-abi');
const { establishConnection, loadPayer } = require('../../lib/network');
const store = require('../../lib/store');

/**
 * Wrap
 */
const wrap = async (amount, dummy, token, source, destination, programId, payer, connection) => {
  console.log('Calling Transfer to', dummy.publicKey.toBase58());
  const schema = [
    { key: 'code', type: 'u8' },
    { key: 'amount', type: 'u64' },
  ]
  const layout = new soproxABI.struct(schema, {
    code: 0,
    amount,
  });
  const tokenProgramId = new PublicKey('CCjbEWaD2BbqC3GLhsjQKt59jaWqebvAC6fYqzF2uLDk');
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      { pubkey: token.publicKey, isSigner: false, isWritable: false },
      { pubkey: source.publicKey, isSigner: false, isWritable: true },
      { pubkey: destination.publicKey, isSigner: false, isWritable: true },
      { pubkey: tokenProgramId, isSigner: false, isWritable: false },
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
 * Report the number of times the greeted account has been said hello to
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
  const payer = await loadPayer(connection);
  const program = store.load('program');
  const programId = new PublicKey(program.address);
  const registers = store.load('abi').schema.map(register => {
    register.publicKey = new PublicKey(register.address);
    return register;
  });
  return { connection, payer, programId, registers }
}

const main = async () => {
  console.log("Let's say hello to a Solana account...");
  const { connection, payer, programId, registers: [dummy, token, source, destination] } = await init();

  console.log('Current data:', await info(source, connection));
  await wrap(1000n, dummy, token, source, destination, programId, payer, connection);
  console.log('New data:', await info(source, connection));
}

try { main() } catch (er) { console.error(er) }
