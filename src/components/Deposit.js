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

import { addLiquidity, loadBalances } from '../store/interactions';

const Deposit = () => {
	const dispatch = useDispatch();

	const [showAlert, setShowAlert] = useState(false)

	const [token1Amount, setToken1Amount] = useState(0)
	const [token2Amount, setToken2Amount] = useState(0)
	
	const provider = useSelector(state => state.provider.connection)
	const account = useSelector(state => state.provider.account)

	const tokens = useSelector(state => state.tokens.contracts)
	const symbols = useSelector(state => state.tokens.symbols)
	const balances = useSelector(state => state.tokens.balances)

	const amm = useSelector(state => state.amm.contract)
	const isDepositing = useSelector(state => state.amm.depositing.isDepositing)
	const isSuccess = useSelector(state => state.amm.depositing.isSuccess)
	const transactionHash = useSelector(state => state.amm.depositing.transactionHash)

	const amountHandler = async (e) => {
		if (e.target.id === 'token1') {
			setToken1Amount(e.target.value)

			const _token1Amount = ethers.utils.parseUnits(e.target.value.toString(), 'ether')
			const result = await amm.calculateToken2Deposit(_token1Amount)
			const _token2Amount = ethers.utils.formatUnits(result.toString(), 'ether')

			setToken2Amount(_token2Amount)
		} else if (e.target.id === 'token2') {
			setToken2Amount(e.target.value)

			const _token2Amount = ethers.utils.parseUnits(e.target.value.toString(), 'ether')
			const result = await amm.calculateToken1Deposit(_token2Amount)
			const _token1Amount = ethers.utils.formatUnits(result.toString(), 'ether')
			
			setToken1Amount(_token1Amount)
		}
		
	}

	const depositHandler = async (e) => {
		e.preventDefault()
		setShowAlert(false)

		const _token1Amount = ethers.utils.parseUnits(token1Amount, 'ether')
		const _token2Amount = ethers.utils.parseUnits(token2Amount, 'ether')

		await addLiquidity(provider, amm, tokens, [_token1Amount, _token2Amount], dispatch)
		await loadBalances(amm, tokens, account, dispatch)
		
		setShowAlert(true)
	}
	
	return(
		<>
			<Card style={{maxWidth:'450px'}} className='mx-auto px-4'>

				{account ? (
					<Form onSubmit={depositHandler} className='my-3'>
						<Row>
							<Form.Text muted className='text-end my-2'>
								Balance:  {balances[0]}
							</Form.Text>
							<InputGroup>
								<Form.Control
									type='number'
									placeholder='0.0'
									min='0.0'
									step='any'
									id='token1'
									onChange={(e) => amountHandler(e)}
									value={token1Amount === 0 ? "" : token1Amount}
								/>
								<InputGroup.Text style={{width:'100px'}} className='justify-content-center'>
									{symbols && symbols[0]}
								</InputGroup.Text>
							</InputGroup>
						</Row>
						<Row className='my-3'>
							<Form.Text muted className='text-end my-2'>
								Balance: {balances[1]}
							</Form.Text>
							<InputGroup>
								<Form.Control
									type='number'
									placeholder='0.0'
									id='token2'
									onChange={(e) => amountHandler(e)}
									value={token2Amount === 0 ? "" : token2Amount}
								/>
								<InputGroup.Text style={{width:'100px'}} className='justify-content-center'>
									{symbols && symbols[1]}
								</InputGroup.Text>
							</InputGroup>
						</Row>
						<Row className='my-3'>
							{isDepositing ? (
								<Spinner animation='border' style={{display: 'block', margin: '0 auto'}}/>
							) : (
								<Button type='submit'>Deposit</Button>
							)}
						</Row>
					</Form>
				) : (
					<p className ='d-flex justify-content-center align-items-center' style={{height: '300px'}}>Connect wallet to use app.</p>
				)}

			</Card>
			{isDepositing ? (
				<Alert
					message={'Deposit Pending...'}
					transactionHash={null}
					variant={'info'}
					setShowAlert={setShowAlert}
					className='alert'
				/>
			) : isSuccess && showAlert ? (
				<Alert
					message={'Deposit Successful.'}
					transactionHash={transactionHash}
					variant={'success'}
					setShowAlert={setShowAlert}
					className='alert'
				/>
			) : !isSuccess && showAlert ? (
				<Alert
					message={'Deposit Failed.'}
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

export default Deposit;