import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { TokenLockABI } from './abi/abis';
import { StandardERC20ABI } from './abi/erc20';
// import {UseWalletProvider, useWallet} from 'use-wallet'
import './App.css';

 // note, contract address must match the address provided by Truffle after migrations
const web3 = new Web3(Web3.givenProvider);
const contractAddr = '0x147aac24F2C2aC08DCB31dEa7F09cb62A4cA8399';

function App() {
  const [number, setNumber] = useState(0);
  const [tokenaddress, settokenAddress] = useState('');
  // let account;
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState({})
  const [tokenbalance, setTokenBalance] = useState(0)
  const [lockamount, setLockAmount] = useState(0)
  // const wallet = useWallet();
  const [providerTitle, setProviderTitle] = useState('')
  const [TokenLockPool, setLockContract] = useState({})
  const [locktime, setLockTime] = useState(0)
  const [penaltyfee, setPenaltyFee] = useState(0)
  const [lockallowance, setLockallowance] = useState(0)
  const [tokenlockedamount, setLockedAmount] = useState(0)

  const loadWeb3 = async () => {
    if (window.ethereum) {
      if(providerTitle === "Wallet Connect") {
        // const provider = new WalletConnectProvider({
        //   infuraId: "27e484dcd9e3efcfd25a83a78777cdf1",
        // });
        // window.web3 = new Web3(provider)
        // await provider.enable().catch(reject => {
        //   setProviderTitle('')
        // })
        // wallet.connect('walletconnect')
      } else if(providerTitle === "BSC Wallet") {
        // const bsc = new BscConnector({
        //   supportedChainIds: [56, 97] // later on 1 ethereum mainnet and 3 ethereum ropsten will be supported
        // })
        
        // await bsc.activate();
        // bsc.getAccount() .then(res => {
        //   setBscAccount(res)
        // })
        // await bsc.getChainId();

      } else if(providerTitle === "Metamask") {
        // wallet.connect('injected')
        
      }
      // await window.ethereum
      //     .request({
      //         method: 'wallet_switchEthereumChain',
      //         params: [{ chainId: '0x38' }], //bsc 0x38 goerli 0x5
      //     })
      //     .then(() => {
      //     })
      //     .catch(async (err) => {
      //         if (err.code === 4902) {
      //             // addChain()
      //         }
      //     });
      window.web3 = new Web3(window.ethereum)
      setProvider(window.web3.currentProvider)
    } 
    else if(window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
      setProvider(window.web3.currentProvider)
    } 
    else {
      // window.alert("Non-ethereum browser detected. should consider trying MetaMask!")
      console.log("Non-ethereum browser detected. should consider trying MetaMask!")
    }
  }

  const loadBlockchainData = async () => {
    const web3 = window.web3
    const accounts = await window.ethereum.enable();
    setAccount(accounts[0])

    // console.log(accounts)
    // console.log(account)
    if(window.ethereum) {
      const accounts = await window.ethereum.enable();
      setAccount(accounts[0])
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      // if(!account || chainId != chainIdConf) {
      //     setNetworkStatus(false)
      // } else {
      //   setNetworkStatus(true)
      // }
      // console.log(chainId)
    }
    if(account) {
      
      await web3.eth.getBalance(account, function (error, result) {
        if (!error) {
            // console.log(result);
        } else {
            console.error(error);
            return
        }
      }); 
    }
  }

  useEffect(() => {

    async function loadfunc() {
      await loadWeb3();
      await loadBlockchainData();
    }

    loadfunc();

  },[account, providerTitle]);

  // useEffect(() => {
  //   settokenAddress('0x9B8911e213E15FDecd986732f92FbcEC04975551')
  // }, [tokenaddress]);

  useEffect(() => {
    window.ethereum.on('chainChanged', (chainId) => {
      console.log("Chain Id changed!");
      // if(chainId === chainIdConf) {
      //   setNetworkStatus(true)
      // } else {
      //   // toast.dark('Wrong Network!', {
      //   //   position: "top-center",
      //   //   autoClose: 3000,
      //   //   hideProgressBar: true,
      //   })
      //   setNetworkStatus(false)
      // }
    });

  }, [window.ethereum])
  
  useEffect(() => {
    window.web3 = new Web3(window.ethereum)
    let lockcontract
    
    try {
      lockcontract = new window.web3.eth.Contract(TokenLockABI, contractAddr);
    } catch (error) {
      console.log("Create Tokenlock Contract Error")
      return
    }

    // console.log(lockcontract);
    setLockContract(lockcontract)
    }, [])

  const getERC20Balance = async (address) => {

    // let web3 = new Web3(window.web3.currentProvider);

    let tokenContract

    try {
      tokenContract = new web3.eth.Contract(StandardERC20ABI, address)
    } catch (error) {
      console.log("Create ERC20 contract Error!")
      return
    }
    

    let decimals, balance, available, lockedamount
    // console.log(lockedamount)
    try {
        // let adjustedBalance = await balance / Math.pow(10, await decimals)
        // console.log("allow balance = " + adjustedBalance);
        decimals = await tokenContract.methods.decimals().call();
        balance = await tokenContract.methods.balanceOf(account).call();
        available = await tokenContract.methods.allowance(account, contractAddr).call();
        lockedamount = await TokenLockPool.methods.GetBalance(account, address).call();
        
        // document.getElementById("output2").innerHTML = adjustedBalance;
        // document.getElementById("output2").innerHTML += " " + await symbol + " (" + await name + ")";
    } catch (error) {
        // document.getElementById("output2").innerHTML = error;
        console.log("Get Information Error");
        return
        // console.log(error)
    }

    setTokenBalance(balance)
    setLockallowance(available)
    setLockedAmount(lockedamount)

  }
  
  const approveToken = async (address, amount) => {

    // let web3 = new Web3(window.web3.currentProvider);
    let gasprice = 0;
    let resulterror
    
    let tokenContract
    
    try {
      tokenContract = new web3.eth.Contract(StandardERC20ABI, address)
    } catch (error) {
      console.log("Create Erc20 token contract error")
      return
    }
    
    // console.log(tokenContract)

    try {
      gasprice = await tokenContract.methods.approve(
        contractAddr,
            amount
          ).estimateGas({ from: account })
      } catch (err) {
          console.log("Get approve estimation gas error")
          return
          // console.log(err)
    }

    // console.log("approve gas = " + gasprice);
    
    //Lock some amount of tokens
    try {
      await tokenContract.methods.approve(contractAddr, amount).send({ from: account, gasprice}).then((res) => {
        console.log("approve success!");
        // console.log(res);
      })
    } catch (error) {
      console.log("approve error")
      return
    }

    // tokenContract.approve.sendTransaction(address, amount, {from: account}, function(error, txnHash) {
    //   if (error) throw error;
    //   console.log("approve success!");
    //   console.log(txnHash);
    // });
  }

  const locktoken = async (address, locktime, penaltyfee) => {

    let gasprice = 0;

    // console.log(penaltyfee)

    try {
      gasprice = await TokenLockPool.methods.holdDeposit(
        address,
        lockamount,
        locktime,
        penaltyfee
          ).estimateGas({ from: account });
      } catch (err) {
          console.log("Get lock estimation gas error")
          return
          // console.log(err);
    }

    // console.log("gas = " + gasprice);
    
    //Lock some amount of tokens
    try {
      await TokenLockPool.methods.holdDeposit(address, lockamount, locktime, penaltyfee).send({ from: account, gasprice}).then((res) => {
        console.log("lock token success!");
        // console.log(res);
      })
    } catch (error) {
      console.log("Lock token error")
      return
    }

  }

  const withdraw = async (address) => {

    let gasprice = 0;
  
    try {
      gasprice = await TokenLockPool.methods.withdraw(
        address
          ).estimateGas({ from: account });
      } catch (err) {
          console.log("Get withdraw estimation gas error")
          return
          // console.log(err);
    }

    // console.log("gas = " + gasprice);
    
    //Lock some amount of tokens
    try {
      await TokenLockPool.methods.withdraw(address).send({ from: account, gasprice}).then((res) => {
        console.log("withdraw token success!");
        console.log(res);
      })
    } catch (error) {
      console.log("withdraw token error")
      return
    }

  }

  const withdraw_remove_fee = async (address) => {

    let gasprice = 0;
  
    try {
      gasprice = await TokenLockPool.methods.panicWithdraw(
        address
          ).estimateGas({ from: account });
      } catch (err) {
          console.log("Get withdraw estimation gas error")
          return
          // console.log(err);
    }

    // console.log("gas = " + gasprice);
    
    //Lock some amount of tokens
    try {
      await TokenLockPool.methods.panicWithdraw(address).send({ from: account, gasprice}).then((res) => {
        console.log("withdraw token success!");
      })
    } catch (error) {
      console.log("withdraw token error")
      return
    }

  }

  const claimtokenfees = async (address) => {

    let gasprice = 0;
  
    try {
      gasprice = await TokenLockPool.methods.claimTokenFees(
        address
          ).estimateGas({ from: account });
      } catch (err) {
          console.log("Get withdraw estimation gas error")
          return
          // console.log(err);
    }

    // console.log("gas = " + gasprice);
    
    //Lock some amount of tokens
    try {
      await TokenLockPool.methods.claimTokenFees(address).send({ from: account, gasprice}).then((res) => {
        console.log("withdraw token success!");
        // console.log(res);
      })
    } catch (error) {
      console.log("withdraw token error")
      return
      // console.log(error)
    }

  }

  const getTokenBalance = async (address) => {
    settokenAddress(address)
    await getERC20Balance(address)
  }


  return (
    <div className="App">
      <header className="App-header">

        <label>
          Input Token Address:
        <input type="text" name="name" width="800px" value={tokenaddress} onChange={ e => getTokenBalance(e.target.value) }/>
        </label>
        <label>
          Token Balance:{tokenbalance}
        </label>
        <label>
          Allowonce:{lockallowance}
        </label>
        <label>
          Current Locked Amount:{tokenlockedamount}
        </label>
        <br />
        <label>
          Input Amount:<input type="text" name="name" value={lockamount} onChange={ e => setLockAmount(e.target.value) }/>
        </label>

        <label>
          Lock Time:<input type="date" name="name" onChange={ e => setLockTime(e.target.valueAsNumber) }/>
          {locktime}
        </label>
        
        <label>
          Penalty Fee:<input type="text" name="name" value={penaltyfee} onChange={ e => setPenaltyFee(e.target.value) }/>
        </label>
        <br/>
        
        <button onClick={e => approveToken(tokenaddress, lockamount)} type="button">Approve</button>
        <button onClick={e => locktoken(tokenaddress, lockamount, locktime, penaltyfee)} type="button">LockToken</button>
        <button onClick={e => withdraw(tokenaddress)} type="button">Withdraw</button>
        {/* { getNumber } */}
      </header>
    </div>
  );
}

export default App;