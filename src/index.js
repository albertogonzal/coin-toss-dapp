import Web3 from 'web3';
import { getContract } from './getContract.js';
import './styles/main.scss';

const web3 = new Web3(Web3.givenProvider);
let contractInstance;
let userAddress;

window.ethereum.enable().then(async (accounts) => {
  let contractData = await getContract();
  userAddress = accounts[0];

  contractInstance = new web3.eth.Contract(
    contractData.abi,
    contractData.address,
    { from: userAddress }
  );
  console.log('contract instance', contractInstance);

  // subscribeEvent(contractInstance, 'Outcome');
  contractInstance.events.Outcome().on('data', async (res) => {
    $('#status').text(res.returnValues.status === 1 ? 'win' : 'lose');
    await updateContractBalance(contractInstance._address);
    await updateBalance(userAddress);
  });

  $('#send').click(() => toss(contractInstance));
  $('#withdraw').click(async () => {
    await contractInstance.methods.withdrawAll().send();
  });

  $('#callback').click(async () => {
    await contractInstance.methods
      .testCallback(web3.utils.fromAscii('abc'), '123')
      .send();
  });

  await updateContractBalance(contractInstance._address);
  await updateBalance(accounts[0]);
});

const toss = async (instance) => {
  await instance.methods
    .toss()
    .send({ value: web3.utils.toWei($('#amount').val(), 'ether') })
    .on('transactionHash', async (hash) => {
      $('#outcome').text(`${$('#amount').val()} eth bet `);
      $('#status').text('tx pending');
    })
    .on('receipt', async () => {
      $('#status').text('sent to provable');
      await updateContractBalance(instance._address);
      await updateBalance(userAddress);
    });
};

// const subscribeEvent = (instance, eventName) => {
//   let eventJsonInterface = web3.utils._.find(
//     instance._jsonInterface,
//     (o) => o.name === eventName && o.type === 'event'
//   );

//   web3.eth.subscribe(
//     'logs',
//     {
//       address: instance._address,
//       topics: [
//         eventJsonInterface.signature,
//         web3.utils.padLeft(userAddress, 64),
//       ],
//     },
//     async (err, res) => {
//       if (!err) {
//         const eventObj = web3.eth.abi.decodeLog(
//           eventJsonInterface.inputs,
//           res.data,
//           res.topics.slice(1)
//         );

//         console.log(eventObj);

//         $('#status').text(eventObj.status === 1 ? 'win' : 'lose');
//         await updateContractBalance(instance._address);
//         await updateBalance(userAddress);
//       }
//     }
//   );
// };

const onProvable = async (res) => {};

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
