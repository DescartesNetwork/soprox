const { PublicKey } = require('@solana/web3.js');

/**
 * Public key (Solana format)
 * Default 11111111111111111111111111111111 for Solana compatibility
 */
class pub {
  constructor(value = '11111111111111111111111111111111') {
    this.value = value;
    this.type = 'pub';
    this.space = 32;
  }

  toBuffer = () => {
    const buf = (new PublicKey(this.value)).toBuffer();
    return buf;
  }

  fromBuffer = (buf) => {
    if (!Buffer.isBuffer(buf)) throw new Error('Invalid buffer');
    this.value = (new PublicKey(buf)).toBase58();
    return this.value;
  }
}

module.exports = { pub }