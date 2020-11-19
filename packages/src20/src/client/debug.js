const { PublicKey, Account } = require('@solana/web3.js');
const { establishConnection, loadPayerFromStore } = require('../../lib/network');

const main = async () => {
  const connection = await establishConnection();
  const payer = loadPayerFromStore();
  const info = await connection.getAccountInfo(payer.publicKey);
  console.log(info);
}

try { main() } catch (er) { console.error(er) }