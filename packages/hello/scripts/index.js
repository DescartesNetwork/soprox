const { establishConnection } = require('../helpers/network');
const { establishPayer, loadProgram } = require('./util');

(async () => {
  const connection = await establishConnection();
  const payer = await establishPayer(connection);
  const { programId, greeterId } = await loadProgram(payer, connection);
  console.log(programId.toBase58(), greeterId.toBase58());
})();