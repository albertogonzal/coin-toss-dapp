const CoinToss = artifacts.require('CoinToss');

module.exports = (deployer, network, accounts) => {
  deployer.deploy(CoinToss, {
    from: accounts[0],
    value: web3.utils.toWei('5', 'ether'),
  });
};
