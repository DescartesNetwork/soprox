const path = require('path');
const fs = require('fs');
const { Account } = require('@solana/web3.js');
const Hello = require('./hello');
const config = require('../soprox.config.json');


const loadProgramAddress = () => {
  const dir = path.join(__dirname, '../dist/main-keypair.json');
  try {
    const programKey = require(dir);
    const program = new Account(programKey);
    return program.publicKey.toBase58();
  } catch (er) {
    throw new Error('You must build and deploy the program first');
  }
}

const loadHelloAddress = async (helloInstance, payer) => {
  const dir = path.join(__dirname, '../dist/hello-keypair.json');
  try {
    // Load the existed account
    const helloKey = require(dir);
    const account = new Account(helloKey);
    return account.publicKey.toBase58();
  } catch (er) {
    // Create a new one
    const account = await helloInstance.rentHelloAccount(payer);
    // Store it
    const data = '[' + account.secretKey.toString() + ']';
    fs.writeFileSync(dir, data, 'utf8');
    return account.publicKey.toBase58();
  }
}

/**
 * Main
 */
(async () => {
  try {
    const { nodeUrl, payer: secretKey } = config;
    const payer = new Account(Buffer.from(secretKey, 'hex'));
    const programAddress = loadProgramAddress();
    const hello = new Hello(programAddress, nodeUrl);
    console.log('*** Calling to program:', programAddress);
    // Build account to store the hello data
    const helloAddress = await loadHelloAddress(hello, payer);
    // Get hello data
    const dataBefore = await hello.getHello(helloAddress);
    console.log('Hello data before a change:', dataBefore);
    // Change hello data
    const txId = await hello.sayHello(helloAddress, payer);
    console.log('Change hello data (txId):', txId);
    // Get hello data
    const dataAfter = await hello.getHello(helloAddress);
    console.log('Hello data after a change:', dataAfter);
  } catch (er) {
    return console.error(er);
  }
})();