const hre = require("hardhat");

const config = require("../src/config.json");

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}
const ether = tokens
const shares = tokens

async function main() {
    console.log(`Fetching accounts & network...\n`)
    const accounts = await ethers.getSigners()
    const deployer = accounts[0]
    const investor1 = accounts[1]
    const investor2 = accounts[2]
    const investor3 = accounts[3]
    const investor4 = accounts[4]

    const {chainId} = await ethers.provider.getNetwork()

    let dapp = await ethers.getContractAt('Token', config[chainId].dapp.address)
    console.log(`DAPP token fetched: ${dapp.address}`)
    let usd = await ethers.getContractAt('Token', config[chainId].usd.address)
    console.log(`USD token fetched: ${usd.address}`)

    let transaction

    transaction = await dapp.connect(deployer).transfer(investor1.address, tokens(10))
    await transaction.wait()
    transaction = await dapp.connect(deployer).transfer(investor2.address, tokens(10))
    await transaction.wait()
    transaction = await dapp.connect(deployer).transfer(investor3.address, tokens(10))
    await transaction.wait()
    transaction = await dapp.connect(deployer).transfer(investor4.address, tokens(10))
    await transaction.wait()

    transaction = await usd.connect(deployer).transfer(investor1.address, tokens(10))
    await transaction.wait()
    transaction = await usd.connect(deployer).transfer(investor2.address, tokens(10))
    await transaction.wait()
    transaction = await usd.connect(deployer).transfer(investor3.address, tokens(10))
    await transaction.wait()
    transaction = await usd.connect(deployer).transfer(investor4.address, tokens(10))
    await transaction.wait()


    let amm = await ethers.getContractAt('AMM', config[chainId].amm.address)
    console.log(`AMM fetched: ${amm.address}`)

    let amount = tokens(100000)

    transaction = await dapp.connect(deployer).approve(amm.address, amount)
    await transaction.wait()
    transaction = await usd.connect(deployer).approve(amm.address, amount)
    await transaction.wait()

    transaction = await amm.connect(deployer).addLiquidity(amount, amount)
    await transaction.wait()

    
    transaction = await dapp.connect(investor1).approve(amm.address, tokens(5))
    await transaction.wait()
    transaction = await amm.connect(investor1).swapToken1(tokens(5))
    await transaction.wait()

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
