const { PublicKey } = require('@solana/web3.js');
const { establishConnection, loadPayerFromStore } = require('../../lib/network');
const store = require('../../lib/store');
const { sayHello, reportHellos, callToggle, reportToggle } = require('./app');


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
  await sayHello(2, registers[0].id, programId, payer, connection);
  let toggleState = await reportToggle(registers[1].id, connection);
  await callToggle(!toggleState, registers[1].id, programId, payer, connection);
  const numGreetings = await reportHellos(registers[0].id, connection);
  console.log(registers[0].id)
  console.log(registers[0].id.toBase58(), 'has been greeted', numGreetings, 'times');
  toggleState = await reportToggle(registers[1].id, connection);
  console.log(registers[1].id.toBase58(), 'is', toggleState, 'in the toggle state');
  console.log('Success');
}

try {
  main();
} catch (er) {
  console.error(er);
}
