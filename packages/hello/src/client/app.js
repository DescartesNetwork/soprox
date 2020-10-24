const { sendAndConfirmTransaction, TransactionInstruction, Transaction } = require('@solana/web3.js');
const BufferLayout = require('buffer-layout');
const BN = require('bn.js');

/**
 * Layout of the greeted account data
 */
const greeterDataLayout = BufferLayout.struct([
  BufferLayout.u32('numGreets'),
]);

/**
 * Say hello
 */
class u32 extends BN {
  toBuffer() {
    const a = super.toArray().reverse();
    const b = Buffer.from(a);
    if (b.length > 4) throw new Error('u64 too large');
    if (b.length === 4) return b;
    const zeroPad = Buffer.alloc(4);
    b.copy(zeroPad);
    return zeroPad;
  }
}
async function sayHello(amount, greeterId, programId, payer, connection) {
  console.log('Saying hello to', greeterId.toBase58());
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    BufferLayout.blob(4, 'amount'),
  ]);
  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode({ instruction: 0, amount: new u32(amount).toBuffer() }, data);
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
async function reportHellos(greeterId, connection) {
  const accountInfo = await connection.getAccountInfo(greeterId);
  if (!accountInfo) throw new Error('Cannot find the greeted account');
  const info = greeterDataLayout.decode(Buffer.from(accountInfo.data));
  console.log(greeterId.toBase58(), 'has been greeted', info.numGreets.toString(), 'times');
}

module.exports = { sayHello, reportHellos }