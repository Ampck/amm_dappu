import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Container } from 'react-bootstrap'

import Navigation from './Navigation';

import { loadProvider, loadAccount, loadNetwork, loadTokens, loadAMM, loadBalances } from '../store/interactions';

function App() {
  const dispatch = useDispatch()

  const loadBlockchainData = async () => {
    const provider = loadProvider(dispatch)
    const chainId = await loadNetwork(provider, dispatch)

    window.ethereum.on('accountsChanged', async () => {
      await loadAccount(dispatch)
    })

    let tokens = await loadTokens(provider, chainId, dispatch)

    await loadAMM(provider, chainId, dispatch)

    //let account = await loadAccount(dispatch)
    //await loadBalances(tokens, account, dispatch)

  }

  useEffect(() => {
    loadBlockchainData()
  }, []);

  return(
    <Container>
      <Navigation/>

      <h1 className='my-4 text-center'>Dapp University AMM</h1>
    </Container>
  )
}

export default App;
