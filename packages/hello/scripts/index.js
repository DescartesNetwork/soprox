const fs = require('fs');
const { establishConnection } = require('../lib/network');
const { establishPayer, loadProgram, loadRegisters } = require('./util');

const pathToProgram = './dist/program/main.so';
const data = fs.readFileSync(pathToProgram);

(async () => {
  const connection = await establishConnection();
  const payer = await establishPayer(connection);
  const program = await loadProgram(data, payer, connection);
  const registers = await loadRegisters(payer, program, connection)
  console.log('Deployment Info:');
  console.log('\tProgram:', program.address);
  registers.forEach(({ address, key }) => {
    console.log(`\tRegister \'${key}\': ${address}`);
  });
})();