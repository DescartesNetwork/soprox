const { establishConnection } = require('../../helpers/network');
const { establishConnection, sayHello, reportHellos } = require('./app');

const main = async () => {
  console.log("Let's say hello to a Solana account...");
  const connection = await establishConnection(); // Establish connection to the cluster
  await sayHello(2); // Say hello to an account
  await reportHellos(); // Find out how many times that account has been greeted
  console.log('Success');
}

try {
  main();
} catch (er) {
  console.error(er);
}
