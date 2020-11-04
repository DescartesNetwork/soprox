const { PublicKey } = require('@solana/web3.js');
const { establishConnection, loadPayerFromStore } = require('../../lib/network');
const store = require('../../lib/store');
const { sayHello, reportHello } = require('./app');


const init = async () => {
  const connection = await establishConnection();
  const payer = loadPayerFromStore();
  const program = store.load('program');
  const programId = new PublicKey(program.id);
  const registers = store.load('registers').schema.map(register => {
    register.id = new PublicKey(register.address);
    return register;
  });
  return { connection, payer, programId, registers }
}

const main = async () => {
  console.log("Let's say hello to a Solana account...");
  const { connection, payer, programId, registers } = await init();
  let [{ numGreets, toggleState }] = await reportHello(registers, connection);
  console.log('Current number of hellos:', numGreets);
  console.log('Current toggle state:', toggleState);
  await sayHello(1, !toggleState, registers[0].id, programId, payer, connection);
  [{ numGreets, toggleState }] = await reportHello(registers, connection);
  console.log('New number of hellos:', numGreets);
  console.log('New toggle state:', toggleState);
  console.log('Success');
}

try { main() } catch (er) { console.error(er) }
