const path = require('path');
const fs = require('fs');
const { Account } = require('@solana/web3.js');
const Hello = require('./hello');
const { nodeUrl } = require('../soprox.config.json');


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

const loadPayer = () => {
  const dir = path.join(__dirname, '../dist/payer-keypair.json');
  try {
    const payerKey = require(dir);
    const payer = new Account(payerKey);
    return payer;
  } catch (er) {
    throw new Error('You must create a payer account first');
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
    const payer = loadPayer();
    const programAddress = loadProgramAddress();
    const hello = new Hello(programAddress, nodeUrl);
    console.log('*** Calling to program:', programAddress);
    console.log('*** Payer:', payer.publicKey.toBase58());
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