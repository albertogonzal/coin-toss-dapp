import Web3 from 'web3';
import { getContract } from './getContract.js';
import './styles/main.scss';

const web3 = new Web3(Web3.givenProvider);
let contractInstance;
let userAddress;
let subscribedEvents = {};

window.ethereum.enable().then(async (accounts) => {
  let contractData = await getContract();
  userAddress = accounts[0];

  contractInstance = new web3.eth.Contract(
    contractData.abi,
    contractData.address,
    { from: userAddress }
  );
  console.log('contract instance', contractInstance);

  // subscribeLogEvent(contractInstance, 'CoinTossed');
  subscribeLogEvent(contractInstance, 'Outcome');
  // subscribeLogEvent(contractInstance, 'TestEvent');

  let slot = '0'.repeat(64);
  let key = web3.utils.fromAscii('0');

  web3.eth.getStorageAt(
    contractInstance._address,
    web3.utils.sha3(key + slot, { encoding: 'hex' }),
    (err, res) => {
      console.log(res);
    }
  );

  await updateContractBalance(contractInstance._address);
  await updateBalance(accounts[0]);

  $('#send').click(() => toss(contractInstance));
  $('#callback').click(() => callback(contractInstance));
  $('#testEvent').click(() => testEvent(contractInstance));
  $('#withdraw').click(async () => {
    await contractInstance.methods.withdrawAll().send();
  });
});

const subscribeLogEvent = (instance, eventName) => {
  const eventJsonInterface = web3.utils._.find(
    instance._jsonInterface,
    (o) => o.name === eventName && o.type === 'event'
  );

  const signature = eventJsonInterface.signature;
  const subscription = web3.eth.subscribe(
    'logs',
    {
      address: instance._address,
      // topics: [
      //   eventJsonInterface.signature,
      //   web3.utils.padLeft(userAddress, 64),
      // ],
    },
    (err, res) => {
      if (!err) {
        console.log(eventName);
        const eventObj = web3.eth.abi.decodeLog(
          eventJsonInterface.inputs,
          res.data,
          res.topics.slice(1)
        );

        // console.log(`New ${eventName}`, eventObj);
      }
    }
  );

  subscribedEvents[eventName] = subscription;
};

const toss = async (instance) => {
  await instance.methods
    .toss()
    .send({ value: web3.utils.toWei($('#amount').val(), 'ether') })
    .on('receipt', async (receipt) => {
      console.log(receipt);
      await updateContractBalance(instance._address);
      await updateBalance(userAddress);
    });
};

const callback = async (instance) => {
  await instance.methods
    .testCallback(parseInt($('#query').val()))
    .send()
    .on('receipt', async (receipt) => {
      console.log(receipt);
      await updateContractBalance(instance._address);
      await updateBalance(userAddress);
    });
};

const testEvent = async (instance) => {
  await contractInstance.methods
    .testEvent()
    .send()
    .on('receipt', (receipt) => console.log('test event receipt', receipt));
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
