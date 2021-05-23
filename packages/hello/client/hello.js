const {
  SystemProgram, Connection, sendAndConfirmTransaction,
  TransactionInstruction, Transaction, PublicKey, Account,
} = require('@solana/web3.js');
const soproxABI = require('soprox-abi');

const HELLO_ACCOUNT_SCHEMA = [{
  key: 'times',
  type: 'u32'
}];


class Hello {
  constructor(programAddress, nodeUrl) {
    this.programId = new PublicKey(programAddress);
    this.connection = new Connection(nodeUrl, 'recent');
  }

  rentHelloAccount = async (payer) => {
    const account = new Account();
    // Compute needed space for a hello account
    const layout = new soproxABI.struct(HELLO_ACCOUNT_SCHEMA);
    const space = layout.space;
    // Compute rental fee
    const lamports = await this.connection.getMinimumBalanceForRentExemption(space);
    const instruction = SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: account.publicKey,
      lamports,
      space,
      programId: this.programId
    });
    const transaction = new Transaction();
    transaction.add(instruction);
    // Send transaction
    await sendAndConfirmTransaction(
      this.connection, transaction, [payer, account],
      { skipPreflight: true, commitment: 'recent' }
    );
    return account;
  }

  getHello = async (helloAddress) => {
    const helloPublicKey = new PublicKey(helloAddress);
    // Get raw data
    const { data } = await this.connection.getAccountInfo(helloPublicKey);
    // Parse data to json
    const layout = new soproxABI.struct(HELLO_ACCOUNT_SCHEMA);
    layout.fromBuffer(data);
    // Return the result
    return layout.value;
  }

  sayHello = async (helloAddress, payer) => {
    const helloPublicKey = new PublicKey(helloAddress);
    // Build input
    const layout = new soproxABI.struct(
      [
        { key: 'code', type: 'u8' },
        { key: 'amount', type: 'u32' }
      ],
      { code: 0, amount: 1 });
    const data = layout.toBuffer();
    // Build transaction
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: helloPublicKey, isSigner: false, isWritable: true },
      ],
      programId: this.programId,
      data,
    });
    const transaction = new Transaction();
    transaction.add(instruction);
    // Send transaction
    const txId = await sendAndConfirmTransaction(
      this.connection, transaction, [payer],
      { skipPreflight: true, commitment: 'recent' }
    );
    return txId;
  }
}

module.exports = Hello;