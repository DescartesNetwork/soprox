const {
  sendAndConfirmTransaction,
  TransactionInstruction,
  Transaction,
  Account,
} = require('@solana/web3.js');
const soproxABI = require('soprox-abi');
const { init, info } = require('./helpers');

/**
 * Approve
 */
const approve = async (amount, token, delegation, source, delegate, programId, payer, connection) => {
  console.log('Approve', amount, 'TOKEN to', delegation.publicKey.toBase58());
  const schema = [
    { key: 'code', type: 'u8' },
    { key: 'amount', type: 'u64' }
  ];
  const layout = new soproxABI.struct(schema, {
    code: 4,
    amount,
  });
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      { pubkey: token.publicKey, isSigner: false, isWritable: false },
      { pubkey: delegation.publicKey, isSigner: true, isWritable: true },
      { pubkey: source.publicKey, isSigner: false, isWritable: false },
      { pubkey: delegate.publicKey, isSigner: false, isWritable: false },
    ],
    programId,
    data: layout.toBuffer()
  });
  const transaction = new Transaction();
  transaction.add(instruction);
  await sendAndConfirmTransaction(
    connection, transaction,
    [
      payer,
      new Account(Buffer.from(delegation.secretKey, 'hex'))
    ],
    {
      skipPreflight: true,
      commitment: 'recent',
    });
}

/**
 * Increase Approval
 */
const increaseApproval = async (amount, token, delegation, programId, payer, connection) => {
  console.log('Increase approval', amount, 'TOKEN to', delegation.publicKey.toBase58());
  const schema = [
    { key: 'code', type: 'u8' },
    { key: 'amount', type: 'u64' }
  ];
  const layout = new soproxABI.struct(schema, {
    code: 6,
    amount,
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
    connection, transaction,
    [payer],
    {
      skipPreflight: true,
      commitment: 'recent',
    });
}

/**
 * Decrease Approval
 */
const decreaseApproval = async (amount, token, delegation, programId, payer, connection) => {
  console.log('Decrease approval', amount, 'TOKEN to', delegation.publicKey.toBase58());
  const schema = [
    { key: 'code', type: 'u8' },
    { key: 'amount', type: 'u64' }
  ];
  const layout = new soproxABI.struct(schema, {
    code: 7,
    amount,
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
    connection, transaction,
    [payer],
    {
      skipPreflight: true,
      commitment: 'recent',
    });
}

/**
 * Transfer from
 */
const transferFrom = async (amount, token, delegation, source, destination, programId, payer, connection) => {
  console.log('TransferFrom', amount, 'TOKEN to', delegation.publicKey.toBase58());
  const schema = [
    { key: 'code', type: 'u8' },
    { key: 'amount', type: 'u64' }
  ];
  const layout = new soproxABI.struct(schema, {
    code: 5,
    amount,
  });
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      { pubkey: token.publicKey, isSigner: false, isWritable: false },
      { pubkey: delegation.publicKey, isSigner: false, isWritable: true },
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
  console.log('\n\n*** Test approve\n');
  const { connection, payer, programId, registers: [token, source, destination, delegation] } = await init();

  await approve(9000n, token, delegation, source, payer, programId, payer, connection);
  console.log('#1 Delegation data:', await info(delegation, connection));
  await increaseApproval(1000n, token, delegation, programId, payer, connection);
  console.log('#2 Delegation data:', await info(delegation, connection));
  await decreaseApproval(100n, token, delegation, programId, payer, connection);
  console.log('#3 Delegation data:', await info(delegation, connection));

  console.log('Current source data:', await info(source, connection));
  console.log('Current destination data:', await info(destination, connection));
  await transferFrom(1000n, token, delegation, source, destination, programId, payer, connection);
  console.log('New source data:', await info(source, connection));
  console.log('New destination data:', await info(destination, connection));

  console.log('#4 Delegation data:', await info(delegation, connection));
}
