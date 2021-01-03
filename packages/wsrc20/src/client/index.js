const {
  sendAndConfirmTransaction,
  TransactionInstruction,
  Transaction,
  Account,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
} = require('@solana/web3.js');
const soproxABI = require('soprox-abi');
const { establishConnection, loadPayer } = require('../../lib/network');
const store = require('../../lib/store');

/**
 * Constructor
 */
const constructor = async (
  symbol,
  wrapper,
  src20_treasury,
  src20_token,
  spl_treasury,
  programId,
  payer,
  connection
) => {
  console.log('Calling Constructor to', wrapper.publicKey.toBase58());
  const schema = [
    { key: 'code', type: 'u8' },
    { key: 'symbol', type: '[char;4]' },
  ]
  const layout = new soproxABI.struct(schema, {
    code: 0,
    symbol,
  });
  const seeds = [wrapper.publicKey.toBuffer()];
  const tokenOwnerPublicKey = await PublicKey.createProgramAddress(seeds, programId);
  const src20ProgramId = new PublicKey('G3JuvCS4Q6u8B9QtHPRyAEBSvggfxQySrzWB1YNF5i1v');
  const splTokenPublickey = new PublicKey('FAA9xNJzgwsy2Awd2AzMigoF8rTr4E6nUrE8ohdBfs6b');
  const splProgramId = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: wrapper.publicKey, isSigner: true, isWritable: true },
      { pubkey: tokenOwnerPublicKey, isSigner: false, isWritable: false },
      { pubkey: src20_treasury.publicKey, isSigner: true, isWritable: true },
      { pubkey: src20_token.publicKey, isSigner: true, isWritable: true },
      { pubkey: src20ProgramId, isSigner: false, isWritable: false },
      { pubkey: spl_treasury.publicKey, isSigner: false, isWritable: true },
      { pubkey: splTokenPublickey, isSigner: false, isWritable: false },
      { pubkey: splProgramId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
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
      new Account(Buffer.from(wrapper.secretKey, 'hex')),
      new Account(Buffer.from(src20_treasury.secretKey, 'hex')),
      new Account(Buffer.from(src20_token.secretKey, 'hex')),
    ],
    {
      skipPreflight: true,
      commitment: 'recent',
    });
}

/**
 * Wrap
 */
const wrap = async (
  amount,
  wrapper,
  src20_treasury,
  src20_token,
  spl_treasury,
  programId,
  payer,
  connection
) => {
  console.log('Calling Wrap to', wrapper.publicKey.toBase58());
  const schema = [
    { key: 'code', type: 'u8' },
    { key: 'amount', type: 'u64' },
  ]
  const layout = new soproxABI.struct(schema, {
    code: 1,
    amount,
  });
  const seeds = [wrapper.publicKey.toBuffer()];
  const tokenOwnerPublicKey = await PublicKey.createProgramAddress(seeds, programId);
  const src20ProgramId = new PublicKey('G3JuvCS4Q6u8B9QtHPRyAEBSvggfxQySrzWB1YNF5i1v');
  const splTokenPublickey = new PublicKey('FAA9xNJzgwsy2Awd2AzMigoF8rTr4E6nUrE8ohdBfs6b');
  const splProgramId = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: wrapper.publicKey, isSigner: true, isWritable: true },
      { pubkey: tokenOwnerPublicKey, isSigner: false, isWritable: false },
      { pubkey: src20_treasury.publicKey, isSigner: true, isWritable: true },
      { pubkey: src20_token.publicKey, isSigner: true, isWritable: true },
      { pubkey: src20ProgramId, isSigner: false, isWritable: false },
      { pubkey: spl_treasury.publicKey, isSigner: false, isWritable: true },
      { pubkey: splTokenPublickey, isSigner: false, isWritable: false },
      { pubkey: splProgramId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
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
      new Account(Buffer.from(wrapper.secretKey, 'hex')),
      new Account(Buffer.from(src20_treasury.secretKey, 'hex')),
      new Account(Buffer.from(src20_token.secretKey, 'hex')),
    ],
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
  const registers = store.load('abi').map(register => {
    register.publicKey = new PublicKey(register.address);
    return register;
  });
  return { connection, payer, programId, registers }
}

const main = async () => {
  console.log("Let's say hello to a Solana account...");
  const {
    connection, payer, programId,
    registers: [wrapper, src20_treasury, src20_token, spl_treasury]
  } = await init();

  await constructor(
    ['S', 'P', 'X', '-'],
    wrapper,
    src20_treasury,
    src20_token,
    spl_treasury,
    programId,
    payer,
    connection
  );
  console.log('Data:', await info(wrapper, connection));
}

try { main() } catch (er) { console.error(er) }
