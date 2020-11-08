const { sendAndConfirmTransaction, TransactionInstruction, Transaction } = require('@solana/web3.js');
const soproxABI = require('../../lib/soprox-abi');

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

module.exports = { sayHello, reportHello }