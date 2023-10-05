import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ethers } from 'ethers';
import Table from 'react-bootstrap/Table';
import Chart from 'react-apexcharts';

import Loading from './Loading';

import { loadAllSwaps } from '../store/interactions'
import { chartSelector } from '../store/selectors'
import { options } from './Charts.config.js'

const Charts = () => {
	const dispatch = useDispatch();

	const provider = useSelector(state => state.provider.connection)
	const account = useSelector(state => state.provider.account)

	const tokens = useSelector(state => state.tokens.contracts)
	const symbols = useSelector(state => state.tokens.symbols)

	const amm = useSelector(state => state.amm.contract)

	const chart = useSelector(chartSelector)

	useEffect(() => {
		if (provider && amm) {
			loadAllSwaps(provider, amm, dispatch)
		}
	}, [provider, amm, dispatch])

	return(
		<div>

			{provider && amm && chart ? (
				<div>
					<Chart
						height='350'
						options={options}
						series={chart.series}
					/>
					<hr/>
					<Table striped bordered hover>
						<thead>
								<tr>
								<th>TxHash</th>
								<th>Token Give</th>
								<th>Amount Give</th>
								<th>Token Get</th>
								<th>Amount Get</th>
								<th>User</th>
								<th>Time</th>
							</tr>
						</thead>
						<tbody>
							{chart.swaps && chart.swaps.map((swap, index) => (
								<tr>
									<td>{swap.hash.toString().slice(0, 6)}...</td>
									<td>{swap.args.tokenGive === tokens[0].address ? symbols[0] : symbols[1]}</td>
									<td>{ethers.utils.formatUnits(swap.args.tokenGiveAmount.toString(), 'ether')}
										{" "}
										{swap.args.tokenGive === tokens[0].address ? symbols[0] : symbols[1]}
									</td>
									<td>{swap.args.tokenGet === tokens[0].address ? symbols[0] : symbols[1]}</td>
									<td>{ethers.utils.formatUnits(swap.args.tokenGetAmount.toString(), 'ether')}
										{" "}
										{swap.args.tokenGet === tokens[0].address ? symbols[0] : symbols[1]}
									</td>
									<td>{swap.args.user.toString().slice(0, 6)}...</td>
									<td>
										{new Date(Number(swap.args.timestamp.toString() + '000')).toLocaleDateString(

											undefined,
											{
												year: 'numeric',
												month: 'long',
												day: 'numeric',
												hour: 'numeric',
												minute: 'numeric',
												second: 'numeric'
											}

										)}
									</td>
								</tr>
							))}
						</tbody>
					</Table>
				</div>
			) : (
				<Loading />
			)}
		</div>
	);
}

export default Charts;