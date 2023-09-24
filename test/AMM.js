const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('Token', () => {
    let token1,
        token2,
        amm,
        accounts,
        deployer

    beforeEach(async () => {
        accounts = await ethers.getSigners()
        deployer = accounts[0]

        const Token = await ethers.getContractFactory('Token')
        token1 = await Token.deploy('Dapp University', 'DAPP', '1000000')
        token2 = await Token.deploy('USD Token', 'USD', '1000000')

        const AMM = await ethers.getContractFactory('AMM')
        amm = await AMM.deploy(token1.address, token2.address)
      
    })

    describe('Deployment', () => {
        it('has an address', async () => {
            expect(amm.address).to.not.equal(0x0)
        })
        it('tracks token1 address', async () => {
            expect(await amm.token1()).to.equal(token1.address)
        })
        it('tracks token2 address', async () => {
            expect(await amm.token2()).to.equal(token2.address)
        })
    })

})
