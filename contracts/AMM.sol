//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./Token.sol";

contract AMM {
	Token public token1;
	Token public token2;

	uint256 public token1Balance;
	uint256 public token2Balance;
	uint256 public k;

	uint256 public totalShares;
	mapping(address => uint256) public shares;
	uint256 constant PRECISION = 10**18;

	event Swap(
		address user,
		address tokenGive,
		uint256 tokenGiveAmount,
		address tokenGet,
		uint256 tokenGetAmount,
		uint256 token1Balance,
		uint256 token2Balance,
		uint256 timestamp
	);

	constructor(Token _token1, Token _token2) {
		token1 = _token1;
		token2 = _token2;
	}

	function addLiquidity
		(uint256 _token1Amount,
		uint256 _token2Amount)
		external
	{
		require(
			token1.transferFrom(msg.sender, address(this), _token1Amount),
			"Failed to transfer token 1...");
		require(
			token2.transferFrom(msg.sender, address(this), _token2Amount),
			"Failed to transfer token 2...");
		require(
			_token1Amount > 0 && _token2Amount > 0,
			"Can not add zero liquidity...");

		uint256 share;


		if (totalShares == 0) {
			share = 100 * PRECISION;
		} else {
			uint256 share1 = (totalShares * _token1Amount) / token1Balance;
			uint256 share2 = (totalShares * _token2Amount) / token2Balance;
			require(
				(share1 / 1000) == (share2 / 1000),
				"Provided liquidity is weighted incorrectly...");
			share = share1;
		}

		token1Balance += _token1Amount;
		token2Balance += _token2Amount;
		k = token1Balance * token2Balance;

		totalShares += share;
		shares[msg.sender] += share;
	}

	function calculateToken1Deposit
		(uint256 _token2Amount)
		view
		public
		returns (uint256)
	{
		return((token1Balance * _token2Amount) / token2Balance);
	}
	
	function calculateToken2Deposit
		(uint256 _token1Amount)
		view
		public
		returns (uint256)
	{
		return((token2Balance * _token1Amount) / token1Balance);
	}

	function calculateToken1Swap
		(uint256 _token1Amount)
		view
		public
		returns(uint256)
	{
		uint256 _token2Balance = (k / (token1Balance + _token1Amount));
		uint256 diff = token2Balance - _token2Balance;

		if (diff == token2Balance) {
			diff--;
		}

		require(diff < token2Balance,
			"Swap cannot exceed pool balance...");

		return diff;
	}

	function calculateToken2Swap
		(uint256 _token2Amount)
		view
		public
		returns(uint256)
	{
		uint256 _token1Balance = (k / (token2Balance + _token2Amount));
		uint256 diff = token1Balance - _token1Balance;

		if (diff == token1Balance) {
			diff--;
		}

		require(diff < token1Balance,
			"Swap cannot exceed pool balance...");

		return diff;
	}

	function swapToken1
		(uint256 _token1Amount)
		external
	{
		uint256 diff = calculateToken1Swap(_token1Amount);
		token1.transferFrom(msg.sender, address(this), _token1Amount);
		token1Balance += _token1Amount;
		token2Balance -= diff;
		token2.transfer(msg.sender, diff);

		emit Swap(msg.sender, address(token1), _token1Amount, address(token2), diff, token1Balance, token2Balance, block.timestamp);
	}

	function swapToken2
		(uint256 _token2Amount)
		external
	{
		uint256 diff = calculateToken2Swap(_token2Amount);
		token2.transferFrom(msg.sender, address(this), _token2Amount);
		token2Balance += _token2Amount;
		token1Balance -= diff;
		token1.transfer(msg.sender, diff);

		emit Swap(msg.sender, address(token2), _token2Amount, address(token1), diff, token1Balance, token2Balance, block.timestamp);
	}

	function calculateWithdrawAmount
		(uint256 _share)
		view
		public
		returns
		(uint256 token1Amount,
		uint256 token2Amount)
	{
		require(_share <= totalShares,
			"Can not remove all liquidity from the pool...");
		token1Amount = (_share * token1Balance) / totalShares;
		token2Amount = (_share * token2Balance) / totalShares;
	}

	function removeLiquidity
		(uint256 _share)
		external
		returns
		(uint256 token1Amount,
		uint256 token2Amount)
	{
		require(_share <= shares[msg.sender],
			"Insuficient number of shares owned...");
		(token1Amount, token2Amount) = calculateWithdrawAmount(_share);
		shares[msg.sender] -= _share;
		totalShares -= _share;

		token1Balance -= token1Amount;
		token2Balance -= token2Amount;
		k = token1Balance * token2Balance;
		token1.transfer(msg.sender, token1Amount);
		token2.transfer(msg.sender, token2Amount);
	}

}