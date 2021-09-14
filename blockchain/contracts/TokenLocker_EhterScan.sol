// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

interface IERC20 {
  function totalSupply() external view returns (uint256);

  function balanceOf(address who) external view returns (uint256);

  function allowance(address owner, address spender)
    external view returns (uint256);

  function transfer(address to, uint256 value) external returns (bool);

  function approve(address spender, uint256 value)
    external returns (bool);

  function transferFrom(address from, address to, uint256 value)
    external returns (bool);

  event Transfer(
    address indexed from,
    address indexed to,
    uint256 value
  );

  event Approval(
    address indexed owner,
    address indexed spender,
    uint256 value
  );
}
contract TokenLocker {
    address public owner;

    constructor(address _owner) {
        owner = _owner;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only available to the contract owner.");
        _;
    }

    event Hold(address indexed holder, address token, uint256 amount, uint256 unlockTime, uint256 penaltyFeePercentage);

    event PanicWithdraw(address indexed holder, address token, uint256 amount, uint256 unlockTime);

    event Withdrawal(address indexed holder, address token, uint256 amount);

    event FeesClaimed();

    struct holder {
        address holderAddress;
        mapping(address => Token) tokens;
    }

    struct Token {
        uint256 balance;
        address tokenAddress;
        uint256 unlockTime;
        uint256 penaltyFeePercentage;
    }

    mapping(address => holder) public holders;

    function holdDeposit(
        address token,
        uint256 amount,
        uint256 unlockTime,
        uint256 penaltyFeePercentage
    ) public {
        require(penaltyFeePercentage >= 10, "Minimal penalty fee is 10%.");

        holder storage holder0 = holders[msg.sender];
        holder0.holderAddress = msg.sender;
        Token storage lockedToken = holders[msg.sender].tokens[token];
        if (lockedToken.balance > 0) {
            lockedToken.balance += amount;
            if (lockedToken.penaltyFeePercentage < penaltyFeePercentage) {
                lockedToken.penaltyFeePercentage = penaltyFeePercentage;
            }
            if (lockedToken.unlockTime < unlockTime) {
                lockedToken.unlockTime = unlockTime;
            }
        }
        else {
            holders[msg.sender].tokens[token] = Token(amount, token, unlockTime, penaltyFeePercentage);
        }
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        emit Hold(msg.sender, token, amount, unlockTime, penaltyFeePercentage);
    }

    function GetBalance(address owner,
        address token
    ) public view returns (uint256){

        Token storage lockedToken = holders[owner].tokens[token];
        return lockedToken.balance;
    }

    function withdraw(address token) public {
        holder storage holder0 = holders[msg.sender];
        require(msg.sender == holder0.holderAddress, "Only available to the token owner.");
        require(block.timestamp > holder0.tokens[token].unlockTime, "Unlock time not reached yet.");

        uint256 amount = holder0.tokens[token].balance;
        holder0.tokens[token].balance = 0;
        IERC20(token).transfer(msg.sender, amount);

        emit Withdrawal(msg.sender, token, amount);
    }

    function panicWithdraw(address token) public {
        holder storage holder0 = holders[msg.sender];
        require(msg.sender == holder0.holderAddress, "Only available to the token owner.");

        uint256 feeAmount = (holder0.tokens[token].balance / 100) * holder0.tokens[token].penaltyFeePercentage;
        uint256 withdrawalAmount = holder0.tokens[token].balance - feeAmount;

        holder0.tokens[token].balance = 0;
        //Transfers fees to the contract administrator/owner
        holders[address(owner)].tokens[token].balance = feeAmount;

        IERC20(token).transfer(msg.sender, withdrawalAmount);

        emit PanicWithdraw(msg.sender, token, withdrawalAmount, holder0.tokens[token].unlockTime);
    }

    function claimTokenListFees(address[] memory tokenList) public onlyOwner {
        for (uint256 i = 0; i < tokenList.length; i++) {
            uint256 amount = holders[owner].tokens[tokenList[i]].balance;
            if (amount > 0) {
                holders[owner].tokens[tokenList[i]].balance = 0;
                IERC20(tokenList[i]).transfer(owner, amount);
            }
        }
        emit FeesClaimed();
    }

    function claimTokenFees(address token) public onlyOwner {
        uint256 amount = holders[owner].tokens[token].balance;
        require(amount > 0, "No fees available for claiming.");
        holders[owner].tokens[token].balance = 0;
        IERC20(token).transfer(owner, amount);
        emit FeesClaimed();
    }
}