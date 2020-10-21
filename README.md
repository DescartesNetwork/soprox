# SoproX

SoproX is a tool that helps developers to conveniently create a Solana Rust-based program (SRP) with no build configuration.

## Etymology

- **So** for Solana
- **proX** for proDucing a proGram

## Quick Overview

Before running your app, please make sure you follow all steps in [Installation](#installation) to completely install crucial development environment.
To create your app, named `my-app`, you can run it immediately by following commands:

```
$ npx soprox my-app
$ cd my-app
$ npm run localnet:update
$ npm run localnet:up
$ npm install
$ npm build
$ npm start
```

SoproX will generate a basic form of a SRP for you including an on-chain program and a off-chain client. Then you can modify these files to build up your owned programs.

## <a name="installation"></a>Installation

If this is your first time, try this [Installtion Notes](https://github.com/solana-labs/example-helloworld/blob/master/README-installation-notes.md) that is authentic from Solana.

All the version should be shown
```
$ node --version
$ npm --version
$ npx --version
$ docker -v
$ wget --version
$ rustup --version
$ rustc --version
$ cargo --version
```

## Version Confusion

*(Cited from [pinned messages](https://discordapp.com/channels/428295358100013066/517163444747894795/750030218575741028) in the Solana Discord)*

There has been some understandable confusion around deploying programs and the versions of the various Solana tools.  To help clarify and give current status:
- A new BPF loader is in the process of being deployed, it's called BPFLoader2
- BPFLoader2 is enabled on testnet only (NOT on devnet or mainnet yet)
- solana_sdk rust crate 1.3.5 switches to using BPFLoader2 by default
- solana-web3.js v0.71.9 requires you to specify which loader to use when loading a program
Recommendation:  The network you choose to deploy determines which loader you will be using:
- If devnet or mainnet, build your program against solana_sdk v1.3.4 and deploy use the latest solana-web3.js v0.71.9 specifying BPFLoader, or deploy using solana-cli v1.3.4.
- If testnet, build your program against solana-sdk v1.3.5 or later and deploy using solana-web3.js v0.71.9 specifying BPFLoader2 or deploy using solana-cli v1.3.5 or later.