const {
  sendAndConfirmTransaction,
  TransactionInstruction,
  Transaction,
  Account,
} = require('@solana/web3.js');
const soproxABI = require('soprox-abi');
const { init, info } = require('./helpers');

/**
 * Token constructor
 */
const tokenConstructor = async (symbol, totalSupply, decimals, token, receiver, programId, payer, connection) => {
  console.log('Token contructor at', token.publicKey.toBase58());
  const schema = [
    { key: 'code', type: 'u8' },
    { key: 'symbol', type: '[char;3]' },
    { key: 'totalSupply', type: 'u64' },
    { key: 'decimals', type: 'u8' },
  ];
  const layout = new soproxABI.struct(schema, {
    code: 0,
    symbol,
    totalSupply,
    decimals,
  });
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      { pubkey: token.publicKey, isSigner: true, isWritable: true },
      { pubkey: receiver.publicKey, isSigner: true, isWritable: true },
    ],
    programId,
    data: layout.toBuffer()
  });
  const transaction = new Transaction();
  transaction.add(instruction);
  await sendAndConfirmTransaction(
    connection,
    transaction,
    [
      payer,
      new Account(Buffer.from(token.secretKey, 'hex')),
      new Account(Buffer.from(receiver.secretKey, 'hex'))
    ],
    {
      skipPreflight: true,
      commitment: 'recent',
    });
}

/**
 * Account constructor
 */
const accountConstructor = async (token, account, programId, payer, connection) => {
  console.log('Account constructor at', account.publicKey.toBase58());
  const schema = [
    { key: 'code', type: 'u8' },
  ];
  const layout = new soproxABI.struct(schema, {
    code: 1,
  });
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      { pubkey: token.publicKey, isSigner: false, isWritable: false },
      { pubkey: account.publicKey, isSigner: true, isWritable: true },
    ],
    programId,
    data: layout.toBuffer()
  });
  const transaction = new Transaction();
  transaction.add(instruction);
  await sendAndConfirmTransaction(
    connection,
    transaction,
    [
      payer,
      new Account(Buffer.from(account.secretKey, 'hex'))
    ],
    {
      skipPreflight: true,
      commitment: 'recent',
    });
}

module.exports = async function () {
  console.log('\n\n*** Test constructor\n');
  const { connection, payer, programId, registers: [token, source, destination, delegation] } = await init();

  try {
    const symbol = ['S', 'P', 'X'];
    const totalSupply = 500000000000000000n;
    const decimals = 8;
    await tokenConstructor(symbol, totalSupply, decimals, token, source, programId, payer, connection);
    await accountConstructor(token, destination, programId, payer, connection);
  } catch (er) {
    // Token or Account is already initialized
    console.log('The token and accound may be created already. Have a look the following error for details.');
    console.error(er);
  }
  return await info(token, connection);
}