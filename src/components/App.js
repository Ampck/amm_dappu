import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Container } from 'react-bootstrap'
import { HashRouter, Routes, Route } from 'react-router-dom'

import Navigation from './Navigation';
import Tabs from './Tabs';
import Swap from './Swap';
import Deposit from './Deposit';
import Withdraw from './Withdraw';
import Charts from './Charts';

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

    let amm = await loadAMM(provider, chainId, dispatch)

    //let account = await loadAccount(dispatch)
    //await loadBalances(tokens, account, dispatch)

  }

  useEffect(() => {
    loadBlockchainData()
  }, []);

  return(
    <Container>
      <HashRouter>
        <Navigation/>
        <hr/>
        <Tabs/>
        <Routes>
          <Route exact path="/" element={<Swap />}/>
          <Route exact path="/deposit" element={<Deposit />}/>
          <Route exact path="/withdraw" element={<Withdraw />}/>
          <Route exact path="/charts" element={<Charts />}/>
        </Routes>
      </HashRouter>
    </Container>
  )
}

export default App;
