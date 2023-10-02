import { ethers } from 'ethers'
import { setAccount, setProvider, setNetwork } from '../store/reducers/provider'

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