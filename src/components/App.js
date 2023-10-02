import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

import Navigation from './Navigation';

import { loadProvider, loadAccount, loadNetwork } from '../store/interactions';

function App() {
  const dispatch = useDispatch()

  const loadBlockchainData = async () => {
    const provider = loadProvider(dispatch)
    const chainId = await loadNetwork(provider, dispatch)

    await loadAccount(dispatch)
  }

  useEffect(() => {
    loadBlockchainData()
  }, []);

  return(
    <Container>
      <Navigation account={'0x0...'} />

      <h1 className='my-4 text-center'>React Hardhat Template</h1>
    </Container>
  )
}

export default App;
