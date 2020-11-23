const {
  sendAndConfirmTransaction,
  TransactionInstruction,
  Transaction,
} = require('@solana/web3.js');
const soproxABI = require('soprox-abi');

const testConstructor = require('./constructor.test');
const testTransfer = require('./transfer.test');
const testApprove = require('./approve.test');
const testDestruct = require('./destruct.test');

const main = async () => {
  await testConstructor();
  await testTransfer();
  await testApprove();
  await testDestruct();
}

try {
  main();
}
catch (er) {
  console.error(er);
}

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
