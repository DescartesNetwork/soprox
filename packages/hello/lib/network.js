const {
  Account, Connection, BPF_LOADER_DEPRECATED_PROGRAM_ID,
  SystemProgram, Transaction, sendAndConfirmTransaction,
  BpfLoader,
} = require('@solana/web3.js');
const { url } = require('./url');
const store = require('./store');

module.exports = {

  /**
   * Establish a connection to the cluster
   */
  establishConnection: async () => {
    const connection = new Connection(url, 'recent');
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', url, version);
    return connection;
  },

  /**
   * Payer
   */
  loadPayerFromStore: () => {
    const data = store.load('payer');
    if (!data) return null;
    const { secretKey } = data;
    const payer = new Account(Buffer.from(secretKey, 'hex'));
    return payer;
  },
  savePayerToStore: (payer) => {
    store.save('payer', {
      address: payer.publicKey.toBase58(),
      secretKey: Buffer.from(payer.secretKey).toString('hex')
    });
  },

  /**
   * Deploy a program to the cluster
   */
  deployProgram: async (data, payer, connection) => {
    const program = new Account();
    await BpfLoader.load(
      connection,
      payer,
      program,
      data,
      BPF_LOADER_DEPRECATED_PROGRAM_ID,
    );
    return program;
  },

  /**
   * Deploy a register to the cluster
   */
  deployRegister: async (space, payer, programId, connection) => {
    const register = new Account();
    let transaction = new Transaction();
    const lamports = await connection.getMinimumBalanceForRentExemption(space);
    transaction.add(SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: register.publicKey,
      lamports,
      space,
      programId,
    }));
    await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer, register],
      { skipPreflight: true, commitment: 'recent' }
    );
    return register;
  },
}