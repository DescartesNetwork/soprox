const { PublicKey } = require('@solana/web3.js');
const { establishConnection, loadPayerFromStore } = require('../../lib/network');
const store = require('../../lib/store');
const { sayHello, reportHellos } = require('./app');


const init = async () => {
  const connection = await establishConnection();
  const payer = loadPayerFromStore();
  const program = store.load('program');
  const programId = new PublicKey(program.id);
  const registers = store.load('registers').map(register => {
    register.id = new PublicKey(register.id);
    return register;
  });
  return { connection, payer, programId, registers }
}

const main = async () => {
  console.log("Let's say hello to a Solana account...");
  const { connection, payer, programId, registers } = await init();
  await sayHello(2, registers[0].id, programId, payer, connection); // Say hello to an account
  await reportHellos(registers[0].id, connection); // Find out how many times that account has been greeted
  console.log('Success');
}

try {
  main();
} catch (er) {
  console.error(er);
}
