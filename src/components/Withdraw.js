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

import { removeLiquidity, loadBalances } from '../store/interactions';

const Withdraw = () => {
	const dispatch = useDispatch();

	const [showAlert, setShowAlert] = useState(false)
	const [amount, setAmount] = useState(0)
	
	const provider = useSelector(state => state.provider.connection)
	const account = useSelector(state => state.provider.account)

	const tokens = useSelector(state => state.tokens.contracts)
	const symbols = useSelector(state => state.tokens.symbols)
	const balances = useSelector(state => state.tokens.balances)

	const amm = useSelector(state => state.amm.contract)
	const shares = useSelector(state => state.amm.shares)

	const isWithdrawing = useSelector(state => state.amm.withdrawing.isWithdrawing)
	const isSuccess = useSelector(state => state.amm.withdrawing.isSuccess)
	const transactionHash = useSelector(state => state.amm.withdrawing.transactionHash)

	const withdrawHandler = async (e) => {
		e.preventDefault()
		setShowAlert(false)

		let _shares = ethers.utils.parseUnits(amount.toString(), 'ether')

		await removeLiquidity(provider, amm, _shares, dispatch)
		await loadBalances(amm, tokens, account, dispatch)
		
		setShowAlert(true)
		setAmount(0)
	}
	return(
		<>
			<Card style={{maxWidth:'450px'}} className='mx-auto px-4'>

				{account ? (
					<Form onSubmit={withdrawHandler} className='my-3'>
						<Row>
							<Form.Text muted className='text-end my-2'>
								Shares:  {shares}
							</Form.Text>
							<InputGroup>
								<Form.Control
									type='number'
									placeholder='0.0'
									min='0.0'
									step='any'
									id='token1'
									value={amount === 0 ? "" : amount}
									onChange={(e) => setAmount(e.target.value)}
								/>
								<InputGroup.Text style={{width:'100px'}} className='justify-content-center'>
									Shares
								</InputGroup.Text>
							</InputGroup>
						</Row>
						<Row className='my-3'>
							{isWithdrawing ? (
								<Spinner animation='border' style={{display: 'block', margin: '0 auto'}}/>
							) : (
								<Button type='submit'>Withdraw</Button>
							)}
						</Row>
						<hr/>
						<Row>
							<p><strong>DAPP Balance: </strong>{balances[0]}</p>
							<p><strong>USD Balance: </strong>{balances[1]}</p>
						</Row>
					</Form>
				) : (
					<p className ='d-flex justify-content-center align-items-center' style={{height: '300px'}}>Connect wallet to use app.</p>
				)}

			</Card>
			{isWithdrawing ? (
				<Alert
					message={'Withdraw Pending...'}
					transactionHash={null}
					variant={'info'}
					setShowAlert={setShowAlert}
					className='alert'
				/>
			) : isSuccess && showAlert ? (
				<Alert
					message={'Withdraw Successful.'}
					transactionHash={transactionHash}
					variant={'success'}
					setShowAlert={setShowAlert}
					className='alert'
				/>
			) : !isSuccess && showAlert ? (
				<Alert
					message={'Withdraw Failed.'}
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

export default Withdraw;