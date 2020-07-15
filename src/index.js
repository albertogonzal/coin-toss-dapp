import Web3 from 'web3';
import { getContractData } from './getContractData.js';
import './styles/main.scss';

const web3 = new Web3(Web3.givenProvider);
let contractInstance;
let contractData;
let userAddress;

window.ethereum.enable().then(async (accounts) => {
  contractData = await getContractData();
  userAddress = accounts[0];
  newContractInstance(contractData);

  chainSetup(contractInstance, ethereum.chainId);
  ethereum.on('chainChanged', (chainId) => {
    newContractInstance(contractData);
    chainSetup(contractInstance, chainId);
  });

  contractInstance.events.Outcome().on('data', async (res) => {
    $('#status').text(res.returnValues.status === parseInt(1) ? 'win' : 'lose');
    await updateContractBalance(contractInstance._address);
    await updateBalance(userAddress);
  });

  $('#send').click(() => toss(contractInstance, ethereum.chainId));
  $('#withdraw').click(async () => {
    await contractInstance.methods.withdrawAll().send();
  });

  $('#testCallback').click(async () => {
    await contractInstance.methods
      .testCallback(
        web3.utils.fromAscii($('#testQueryCallback').val()),
        parseInt($('#testResult').val())
      )
      .send();
  });

  await updateContractBalance(contractInstance._address);
  await updateBalance(accounts[0]);
});

const toss = async (instance, chainId) => {
  if (Number.isInteger(parseInt(chainId))) {
    await instance.methods
      .toss()
      .send({ value: web3.utils.toWei($('#amount').val(), 'ether') })
      .on('transactionHash', onTxHash)
      .on('receipt', onReceipt);
  } else {
    await instance.methods
      .testToss(web3.utils.fromAscii($('#testQuerySend').val()))
      .send({ value: web3.utils.toWei($('#amount').val(), 'ether') })
      .on('transactionHash', onTxHash)
      .on('receipt', onReceipt);
  }
};

const onTxHash = async () => {
  $('#outcome').text(`${$('#amount').val()} eth bet `);
  $('#status').text('tx pending');
};

const onReceipt = async () => {
  $('#status').text('sent to provable');
  await updateContractBalance(contractInstance._address);
  await updateBalance(userAddress);
};

const newContractInstance = async (contractData) => {
  let chain = Number.isInteger(parseInt(ethereum.chainId))
    ? parseInt(ethereum.chainId)
    : 'local';
  contractInstance = new web3.eth.Contract(
    contractData.abi,
    contractData.address[chain],
    {
      from: userAddress,
    }
  );
};

const chainSetup = async (instance, chainId) => {
  let chain = Number.isInteger(parseInt(chainId)) ? parseInt(chainId) : 'local';
  let message;

  switch (chain) {
    case 1:
      message =
        'main ethereum network, please change to a test or local network';
      break;
    case 3:
      message = 'ropsten';
      break;
    case 4:
      message = 'rinkeby';
      break;
    case 'local':
      message = 'local';
      break;
    default:
      message = 'please change to a test or local network';
      break;
  }

  if (chain === 'local') {
    $('#test').removeClass('d-none');
    $('#testQuerySend').removeClass('d-none');
  } else {
    $('#test').addClass('d-none');
    $('#testQuerySend').addClass('d-none');
  }
  $('#network').text(message);

  await updateContractBalance(contractInstance._address);
  await updateBalance(userAddress);
};

const updateBalance = async (address) => {
  let balance = await web3.eth.getBalance(address);
  let balanceEth = web3.utils.fromWei(balance, 'ether');
  $('#balance').text(balanceEth);
};

const updateContractBalance = async (address) => {
  let balance = await web3.eth.getBalance(address);
  let balanceEth = web3.utils.fromWei(balance, 'ether');
  $('#cbalance').text(balanceEth);
};
