import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Card from'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import { ethers } from 'ethers';

import Alert from './Alert';

import { swap, loadBalances } from '../store/interactions';

const Swap = () => {
	const dispatch = useDispatch();

	const [price, setPrice] = useState(0)

	const [inputToken, setInputToken] = useState(null)
	const [outputToken, setOutputToken] = useState(null)

	const [inputAmount, setInputAmount] = useState(0)
	const [outputAmount, setOutputAmount] = useState(0)

	const [showAlert, setShowAlert] = useState(false)


	const provider = useSelector(state => state.provider.connection)
	const account = useSelector(state => state.provider.account)
	const tokens = useSelector(state => state.tokens.contracts)
	const symbols = useSelector(state => state.tokens.symbols)
	const balances = useSelector(state => state.tokens.balances)

	const amm = useSelector(state => state.amm.contract) 
	const isSwapping = useSelector(state => state.amm.swapping.isSwapping)
	const isSuccess = useSelector(state => state.amm.swapping.isSuccess)
	const transactionHash = useSelector(state => state.amm.swapping.transactionHash)

	const inputHandler = async (e) => {
		if (!inputToken || !outputToken) {
			window.alert('Please select token.')
			return

		}

		if (inputToken === outputToken) {
			window.alert('Invalid token pair.')
			return
		}

		if (inputToken === 'DAPP') {
			setInputAmount(e.target.value)
			
			const _token1Amount = ethers.utils.parseUnits(e.target.value.toString(), 'ether')
			const result = await amm.calculateToken1Swap(_token1Amount)
			const _token2Amount = ethers.utils.formatUnits(result.toString(), 'ether')
			
			setOutputAmount(_token2Amount.toString())
		} else {

			setInputAmount(e.target.value)
			
			const _token2Amount = ethers.utils.parseUnits(e.target.value, 'ether')
			const result = await amm.calculateToken2Swap(_token2Amount)
			const _token1Amount = ethers.utils.formatUnits(result.toString(), 'ether')
			
			setOutputAmount(_token1Amount.toString())

		}
	}

	const swapHandler = async (e) => {
		e.preventDefault()
		setShowAlert(false)
		if (inputToken === outputToken) {
			window.alert("Invalid token pair.")
			return
		}

		const _inputAmount = ethers.utils.parseUnits(inputAmount, 'ether')

		if (inputToken === 'DAPP') {
			await swap(provider, amm, tokens[0], inputToken, _inputAmount, dispatch)
		} else {
			await swap(provider, amm, tokens[1], inputToken, _inputAmount, dispatch)
		}

		await loadBalances(amm, tokens, account, dispatch)
		await getPrice()

		setShowAlert(true)

	}

	const getPrice = async () => {
		if (inputToken === outputToken) {
			setPrice(1)
		} else if (inputToken === 'DAPP') {
			setPrice((await amm.token2Balance()) / (await amm.token1Balance()))
		} else {
			setPrice((await amm.token1Balance()) / (await amm.token2Balance()))	
		}
		
		console.log((await amm.token1Balance()), (await amm.token2Balance()))
	}

	useEffect(() => {
		if (inputToken && outputToken) {
			getPrice()
		}
	}, [inputToken, outputToken])

	return(
		<>
			<Card style={{maxWidth:'450px'}} className='mx-auto px-4'>

				{account ? (
					<Form onSubmit={swapHandler} className='my-3'>
						<Row>
							<div className='d-flex justify-content-between'>
								<Form.Label><strong>Input: </strong></Form.Label>
								<Form.Text muted>
									Balance: {
										inputToken === symbols[0] ? (
											balances[0]
										) : inputToken === symbols[1] ? (
											balances[1]
										) : 0
									} 
								</Form.Text>
							</div>
							<InputGroup>
								<Form.Control
									type='number'
									placeholder='0.0'
									min='0.0'
									step='any'
									onChange={(e) => inputHandler(e)}
									disabled={!inputToken}
								/>
								<DropdownButton
								variant='outline-secondary'
								title={inputToken ? inputToken : 'Select Token...'}
							>
								<Dropdown.Item onClick={(e) => setInputToken(e.target.innerHTML)}>DAPP</Dropdown.Item>
								<Dropdown.Item onClick={(e) => setInputToken(e.target.innerHTML)}>USD</Dropdown.Item>
							</DropdownButton>
							</InputGroup>
						</Row>
						<Row>
							<div className='d-flex justify-content-between'>
								<Form.Label><strong>Input: </strong></Form.Label>
								<Form.Text muted>
									Balance: {
										outputToken === symbols[0] ? (
											balances[0]
										) : outputToken === symbols[1] ? (
											balances[1]
										) : 0
									}
								</Form.Text>
							</div>
							<InputGroup>
								<Form.Control
									type='number'
									placeholder='0.0'
									value={outputAmount === 0 ? "" : outputAmount}
									disabled
								/>
								<DropdownButton
								variant='outline-secondary'
								title={outputToken ? outputToken : 'Select Token...'}
							>
								<Dropdown.Item onClick={(e) => setOutputToken(e.target.innerHTML)}>DAPP</Dropdown.Item>
								<Dropdown.Item onClick={(e) => setOutputToken(e.target.innerHTML)}>USD</Dropdown.Item>
							</DropdownButton>
							</InputGroup>
						</Row>
						<Row className='my-3'>
							{isSwapping ? (
								<Spinner animation='border' style={{display: 'block', margin: '0 auto'}}/>
							) : (
								<Button type='submit'>Swap</Button>
							)}
							<Form.Text muted>
								Exchange Rate: {price}
							</Form.Text>
						</Row>
					</Form>
				) : (
					<p className ='d-flex justify-content-center align-items-center' style={{height: '300px'}}>Connect wallet to use app.</p>
				)}

			</Card>
			{isSwapping ? (
				<Alert
					message={'Swap Pending...'}
					transactionHash={null}
					variant={'info'}
					setShowAlert={setShowAlert}
					className='alert'
				/>
			) : isSuccess && showAlert ? (
				<Alert
					message={'Swap Successful.'}
					transactionHash={transactionHash}
					variant={'success'}
					setShowAlert={setShowAlert}
					className='alert'
				/>
			) : !isSuccess && showAlert ? (
				<Alert
					message={'Swap Failed.'}
					transactionHash={null}
					variant={'danger'}
					setShowAlert={setShowAlert}
					className='alert'
				/>
			) :(
				<></>
			)}
			
		</>
	);
}

export default Swap;