const {
  sendAndConfirmTransaction,
  TransactionInstruction,
  Transaction,
} = require('@solana/web3.js');
const soproxABI = require('soprox-abi');
const { init, info } = require('./helpers');

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

module.exports = async function () {
  console.log('\n\n*** Test transfer\n');
  const { connection, payer, programId, registers: [token, source, destination, delegation] } = await init();

  console.log('Current source data:', await info(source, connection));
  console.log('Current destination data:', await info(destination, connection));
  await transfer(1000n, token, source, destination, programId, payer, connection);
  console.log('New source data:', await info(source, connection));
  console.log('New destination data:', await info(destination, connection));
}
