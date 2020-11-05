const { sendAndConfirmTransaction, TransactionInstruction, Transaction } = require('@solana/web3.js');
const soproxABI = require('../../lib/soprox-abi');

/**
 * Say hello
 */
const sayHello = async (amount, toggle, greeterId, programId, payer, connection) => {
  console.log('Saying hello to', greeterId.toBase58());
  const _instruction = new soproxABI.u8(0);
  const _amount = new soproxABI.u32(amount);
  const _toggle = new soproxABI.bool(toggle);
  const data = soproxABI.pack(_instruction, _amount, _toggle);
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
 * Report the number of times the greeted account has been said hello to
 */
const reportHello = async (registers, connection) => {
  return await Promise.all(registers.map(async register => {
    const { data } = await connection.getAccountInfo(register.id);
    if (!data) throw new Error('Cannot find data of', register.address);
    let layout = {};
    register.serialization.forEach(item => {
      layout[item.key] = new soproxABI[item.type]();
    });
    return soproxABI.unpack(data, layout);
  }));
}

module.exports = { sayHello, reportHello }