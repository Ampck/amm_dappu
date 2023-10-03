import { ethers } from 'ethers'
import { setAccount, setProvider, setNetwork } from './reducers/provider'
import { setContracts, setSymbols, balancesLoaded } from './reducers/tokens'
import { setContract, sharesLoaded } from './reducers/amm'

import TOKEN_ABI from '../abis/Token.json';
import AMM_ABI from '../abis/AMM.json';

import config from '../config.json';

export const loadProvider = (dispatch) => {
	const provider = new ethers.providers.Web3Provider(window.ethereum)
	dispatch(setProvider(provider))

	return provider
}

export const loadNetwork = async (provider, dispatch) => {
	const { chainId } = await provider.getNetwork()
	dispatch(setNetwork(chainId))
	
	return chainId
}

export const loadAccount = async (dispatch) => {
	const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = accounts[0]
    dispatch(setAccount(account))

    return account
}

export const loadTokens = async (provider, chainId, dispatch) => {
	const dapp = new ethers.Contract(config[chainId].dapp.address, TOKEN_ABI, provider)
	const usd = new ethers.Contract(config[chainId].usd.address, TOKEN_ABI, provider)

	dispatch(setContracts([dapp, usd]))
	dispatch(setSymbols([await dapp.symbol(), await usd.symbol()]))

	return [dapp, usd]
}

export const loadAMM = async (provider, chainId, dispatch) => {
	const amm = new ethers.Contract(config[chainId].amm.address, AMM_ABI, provider)

	dispatch(setContract(amm))

	return amm
}

export const loadBalances = async (amm, tokens, account, dispatch) => {
	dispatch(balancesLoaded([
		ethers.utils.formatUnits((await tokens[0].balanceOf(account)).toString(), 'ether'),
		ethers.utils.formatUnits((await tokens[1].balanceOf(account)).toString(), 'ether')
	]))
	dispatch(sharesLoaded(ethers.utils.formatUnits((await amm.shares(account)).toString(), 'ether')))
}