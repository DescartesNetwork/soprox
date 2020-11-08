const { PublicKey } = require('@solana/web3.js');
const { establishConnection, loadPayerFromStore } = require('../../lib/network');
const store = require('../../lib/store');
const { sayHello, reportHello } = require('./app');


const init = async () => {
  const connection = await establishConnection();
  const payer = loadPayerFromStore();
  const program = store.load('program');
  const programId = new PublicKey(program.address);
  const registers = store.load('abi').schema.map(register => {
    register.id = new PublicKey(register.address);
    return register;
  });
  return { connection, payer, programId, registers }
}

const main = async () => {
  console.log("Let's say hello to a Solana account...");
  const { connection, payer, programId, registers: [register] } = await init();
  let data = await reportHello(register, connection);
  console.log('Current data:', data);
  await sayHello(1, !data.toggleState, register, programId, payer, connection);
  data = await reportHello(register, connection);
  console.log('New data:', data);
  console.log('Success');
}

try { main() } catch (er) { console.error(er) }
