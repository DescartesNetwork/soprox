const testConstructor = require('./constructor.test');
const testTransfer = require('./transfer.test');
const testApprove = require('./approve.test');
const testDestruct = require('./destruct.test');

const main = async () => {
  await testConstructor();
  await testTransfer();
  await testApprove();
  await testDestruct();
}

try {
  main();
}
catch (er) {
  console.error(er);
}