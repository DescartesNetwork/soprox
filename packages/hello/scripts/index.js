const fs = require('fs');
const { PublicKey } = require('@solana/web3.js');
const { establishConnection } = require('../helpers/network');
const { establishPayer, loadProgram } = require('./util');

const pathToProgram = './dist/program/main.so';
const data = fs.readFileSync(pathToProgram);

(async () => {
  const connection = await establishConnection();
  const payer = await establishPayer(connection);
  const [{ program }, { register }] = await loadProgram(data, payer, connection);
  const programId = new PublicKey(program.id);
  const greeterId = new PublicKey(register.id);
  console.log(programId.toBase58(), greeterId.toBase58());
})();