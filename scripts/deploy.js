const hre = require("hardhat");

async function main() {
    const Token = await hre.ethers.getContractFactory('Token')
  
    let dapp = await Token.deploy('Dapp Token', 'DAPP', '1000000')
    await dapp.deployed()
    console.log(`DAPP deployed to: ${dapp.address}\n`)

    let usd = await Token.deploy('USD Token', 'USD', '1000000')
    await usd.deployed()
    console.log(`USD deployed to: ${usd.address}\n`)

    const AMM = await hre.ethers.getContractFactory('AMM')
    const amm = await AMM.deploy(dapp.address, usd.address)
    console.log(`AMM contract deployed to ${amm.address}`)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
