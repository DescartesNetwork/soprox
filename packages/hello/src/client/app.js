const { sendAndConfirmTransaction, TransactionInstruction, Transaction } = require('@solana/web3.js');
const { layout, u8, u32, bool } = require('../../lib/type');

/**
 * Say hello
 */
const sayHello = async (amount, greeterId, programId, payer, connection) => {
  console.log('Saying hello to', greeterId.toBase58());
  const _instruction = new u8(0);
  const _amount = new u32(amount);
  const data = layout(_instruction, _amount);
  const instruction = new TransactionInstruction({
    keys: [{ pubkey: greeterId, isSigner: false, isWritable: true }],
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
 * Call toggle
 */

const callToggle = async (toggle, togglerId, programId, payer, connection) => {
  console.log('Calling toggle to', togglerId.toBase58());
  const _instruction = new u8(1);
  const _toggle = new bool(toggle);
  const data = layout(_instruction, _toggle);
  const instruction = new TransactionInstruction({
    keys: [{ pubkey: togglerId, isSigner: false, isWritable: true }],
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
const reportHellos = async (greeterId, connection) => {
  const accountInfo = await connection.getAccountInfo(greeterId);
  if (!accountInfo) throw new Error('Cannot find the greeted account');
  const info = (new u32()).fromBuffer(accountInfo.data);
  console.log(greeterId.toBase58(), 'has been greeted', info, 'times');
}

module.exports = { sayHello, callToggle, reportHellos }