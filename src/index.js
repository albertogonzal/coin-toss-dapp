import Web3 from 'web3';
import { getContract } from './contract.js';

const web3 = new Web3(Web3.givenProvider);
let contract;
let contractInstance;
let userAddress;
let testQuery;

window.ethereum.enable().then(async (accounts) => {
  contract = await getContract();
  userAddress = accounts[0];
  contractInstance = new web3.eth.Contract(contract.abi, contract.address, {
    from: userAddress,
  });

  await updateContractBalance(contract.address);
  await updateBalance(accounts[0]);

  $('#send').click(() => toss(contractInstance));
  $('#callback').click(() => callback(contractInstance));
});

const toss = async (instance) => {
  await instance.methods
    .toss()
    .send({ value: web3.utils.toWei($('#amount').val(), 'ether') })
    .on('transactionHash', (hash) => {
      // console.log(`hash: ${hash}`);
    })
    .on('confirmation', (confirmationNumber) => {
      // console.log(`confirmationNumber: ${confirmationNumber}`);
    })
    .on('receipt', async (receipt) => {
      console.log(receipt);
      testQuery = receipt.events.LogNewProvableQuery.returnValues.query;
      // $('#outcome').text(outcome);
      await updateContractBalance(contract.address);
      await updateBalance(userAddress);
    });
};

const callback = async (instance) => {
  await instance.methods
    // .testCallback(web3.utils.fromAscii(testQuery))
    .testCallback(testQuery)
    .send()
    .on('receipt', async (receipt) => {
      console.log(
        receipt.events.GeneratedRandomNumber.returnValues.randomNumber
      );
      console.log(receipt.events.Outcome.returnValues.outcome);

      await updateContractBalance(contract.address);
      await updateBalance(userAddress);
    });
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
