const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}
const ether = tokens
const shares = tokens

describe('AMM', () => {
    let transaction,
        result,
        estimate,
        balance,

        token1,
        token2,
        amm,

        accounts,
        deployer,
        liquidityProvider,
        investor1,
        investor2

    beforeEach(async () => {
        //Setup ethereum accounts
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        liquidityProvider = accounts[1]
        investor1 = accounts[2]
        investor2 = accounts[3]

        //Deploy token contracts
        const Token = await ethers.getContractFactory('Token')
        token1 = await Token.deploy('Dapp University', 'DAPP', '1000000')
        token2 = await Token.deploy('USD Token', 'USD', '1000000')

        //Give token supplies to liquidity provider account
        transaction = await token1.connect(deployer).transfer(liquidityProvider.address, tokens(100000))
        result = transaction.wait()
        transaction = await token2.connect(deployer).transfer(liquidityProvider.address, tokens(100000))
        result = transaction.wait()

        transaction = await token1.connect(deployer).transfer(investor1.address, tokens(100000))
        result = transaction.wait()
        transaction = await token2.connect(deployer).transfer(investor2.address, tokens(100000))
        result = transaction.wait()

        //Deploy AMM contract with token addresses
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

    describe('Swapping Tokens', () => {
        let amount,
            token2Deposit
        it('facilitates swaps', async () => {
            amount = tokens(100000)
            
            transaction = await token1.connect(deployer).approve(amm.address, amount)
            result = await transaction.wait()
            transaction = await token2.connect(deployer).approve(amm.address, amount)
            result = await transaction.wait()
            transaction = await amm.connect(deployer).addLiquidity(amount, amount)
            result = await transaction.wait()

            expect(await token1.balanceOf(amm.address)).to.equal(amount)
            expect(await token2.balanceOf(amm.address)).to.equal(amount)

            expect(await amm.token1Balance()).to.equal(amount)
            expect(await amm.token2Balance()).to.equal(amount)

            expect(await amm.shares(deployer.address)).to.equal(tokens(100))
            expect(await amm.totalShares()).to.equal(tokens(100))

            amount = tokens(50000)
            transaction = await token1.connect(liquidityProvider).approve(amm.address, amount)
            result = await transaction.wait()
            transaction = await token2.connect(liquidityProvider).approve(amm.address, amount)
            result = await transaction.wait()

            token2Deposit = await amm.calculateToken2Deposit(amount)

            transaction = await amm.connect(liquidityProvider).addLiquidity(amount, token2Deposit)
            result = await transaction.wait()

            expect(await amm.shares(liquidityProvider.address)).to.equal(tokens(50))
            expect(await amm.shares(deployer.address)).to.equal(tokens(100))
            expect(await amm.totalShares()).to.equal(tokens(150))

            console.log(`Current price: ${
                (await amm.token2Balance())
                /
                (await amm.token1Balance())
            }`)

            transaction = await token1.connect(investor1).approve(amm.address, tokens(100000))
            result = await transaction.wait()

            console.log(`investor1 token2 balance: ${await token2.balanceOf(investor1.address)}`)
            estimate = await amm.connect(investor1).calculateToken1Swap(tokens(1))
            console.log(`investor1 will receive the following amount of token2: ${ethers.utils.formatUnits(estimate, 'ether')}`)

            transaction = await amm.connect(investor1).swapToken1(tokens(1))
            await expect(transaction).to.emit(amm, 'Swap')
                .withArgs(
                    investor1.address,
                    token1.address,
                    tokens(1),
                    token2.address,
                    estimate,
                    await amm.token1Balance(),
                    await amm.token2Balance(),
                    (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
                )


            balance = (await token2.balanceOf(investor1.address))
            expect(balance).to.equal(estimate)
            console.log(`investor 1 receieved the following amount of token2: ${ethers.utils.formatUnits(balance, 'ether')}`)

            expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
            expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())

            console.log(`Current price: ${
                (await amm.token2Balance())
                /
                (await amm.token1Balance())
            }`)

            transaction = await amm.connect(investor1).swapToken1(tokens(10))

            console.log(`Current price: ${
                (await amm.token2Balance())
                /
                (await amm.token1Balance())
            }`)

            transaction = await amm.connect(investor1).swapToken1(tokens(1000))

            console.log(`Current price: ${
                (await amm.token2Balance())
                /
                (await amm.token1Balance())
            }`)

            transaction = await token2.connect(investor2).approve(amm.address, tokens(100000))
            result = await transaction.wait()

            balance = await token1.balanceOf(investor2.address)
            console.log(`investor2 token1 balance: ${await token1.balanceOf(investor2.address)}`)

            estimate = await amm.calculateToken2Swap(tokens(1))
            console.log(`investor2 will receive the following amount of token1: ${ethers.utils.formatUnits(estimate, 'ether')}`)

            transaction = await amm.connect(investor2).swapToken2(tokens(1))
            result = await transaction.wait()

            await expect(transaction).to.emit(amm, 'Swap')
                .withArgs(
                    investor2.address,
                    token2.address,
                    tokens(1),
                    token1.address,
                    estimate,
                    await amm.token1Balance(),
                    await amm.token2Balance(),
                    (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
                )

            balance = await token1.balanceOf(investor2.address)
            console.log(`investor 2 receieved the following amount of token1: ${ethers.utils.formatUnits(balance, 'ether')}`)
            expect(estimate).to.equal(balance)

            console.log(`Current price: ${
                (await amm.token2Balance())
                /
                (await amm.token1Balance())
            }`)

            console.log(`AMM token1Balance: ${ethers.utils.formatEther(await amm.token1Balance(), 'ether')}`)
            console.log(`AMM token2Balance: ${ethers.utils.formatEther(await amm.token2Balance(), 'ether')}`)

            balance = await token1.balanceOf(liquidityProvider.address)
            console.log(`liquidityProvider token1 balance before removing liquidity: ${balance}`)
            balance = await token2.balanceOf(liquidityProvider.address)
            console.log(`liquidityProvider token2 balance before removing liquidity: ${balance}`)
            balance = await amm.shares(liquidityProvider.address)
            console.log(`liquidityProvider shares before removing liquidity: ${ethers.utils.formatUnits(balance, 'ether')}`)

            transaction = await amm.connect(liquidityProvider).removeLiquidity(shares(50))
            result = transaction.wait()
            balance = await token1.balanceOf(liquidityProvider.address)
            console.log(`liquidityProvider token1 balance after removing liquidity: ${balance}`)
            balance = await token2.balanceOf(liquidityProvider.address)
            console.log(`liquidityProvider token2 balance after removing liquidity: ${balance}`)
            balance = await amm.shares(liquidityProvider.address)
            console.log(`liquidityProvider shares after removing liquidity: ${ethers.utils.formatUnits(balance, 'ether')}`)

        })
    })

})
