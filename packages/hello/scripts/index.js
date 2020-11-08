const fs = require('fs');
const { establishConnection } = require('../lib/network');
const { establishPayer, loadProgram, loadRegisters } = require('./util');

const pathToProgram = './dist/program/main.so';
const data = fs.readFileSync(pathToProgram);

(async () => {
  const connection = await establishConnection();
  const payer = await establishPayer(connection);
  const programId = await loadProgram(data, payer, connection);
  const registers = await loadRegisters(payer, programId, connection)
  console.log('Deployment Info:');
  console.log('\tProgram:', programId.toBase58());
  registers.forEach(({ id, key }) =>
    console.log(`\tRegister \'${key}\': ${id.toBase58()}`)
  );
})();