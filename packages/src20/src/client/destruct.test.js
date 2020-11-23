const {
  sendAndConfirmTransaction,
  TransactionInstruction,
  Transaction,
} = require('@solana/web3.js');
const soproxABI = require('soprox-abi');
const { init, info } = require('./helpers');

/**
 * Revoke
 */
const revoke = async (token, delegation, programId, payer, connection) => {
  console.log('Revoke', delegation.publicKey.toBase58());
  const schema = [
    { key: 'code', type: 'u8' },
  ];
  const layout = new soproxABI.struct(schema, {
    code: 8,
  });
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      { pubkey: token.publicKey, isSigner: false, isWritable: false },
      { pubkey: delegation.publicKey, isSigner: false, isWritable: true },
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

module.exports = async function () {
  console.log('\n\n*** Test destruct\n');
  const { connection, payer, programId, registers: [token, source, destination, delegation] } = await init();
  console.log('Current owner lamports:', await connection.getBalance(payer.publicKey));
  await revoke(token, delegation, programId, payer, connection);
  console.log('New owner lamports:', await connection.getBalance(payer.publicKey));
}