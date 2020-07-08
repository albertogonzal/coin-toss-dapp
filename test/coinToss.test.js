const CoinToss = artifacts.require('CoinToss');
const truffleAssert = require('truffle-assertions');

contract('CoinToss', async (accounts) => {
  let ownerAddress = accounts[5];
  let foreignAddress = accounts[6];
  let testAmount = parseFloat(web3.utils.toWei('10', 'ether'));
  let minimumAmount = parseFloat(web3.utils.toWei('1', 'ether'));
  let zeroAmount = parseFloat(web3.utils.toWei('0', 'ether'));
  let instance;
  let contractAddress;

  beforeEach(async () => {
    instance = await CoinToss.new({
      from: ownerAddress,
      value: testAmount,
    });
  });

  it('should initialize balance', async () => {
    let contractBalance = parseFloat((await instance.balance()).toString());
    let blockchainBalance = parseFloat(
      await web3.eth.getBalance(instance.address)
    );

    assert(
      contractBalance === blockchainBalance && contractBalance === testAmount,
      'Balance not initialized properly.'
    );
  });

  it('should not allow non owner to withdraw', async () => {
    await truffleAssert.fails(
      instance.withdrawAll({ from: foreignAddress }),
      truffleAssert.ErrorType.REVERT
    );
  });

  it('should allow owner to withdraw', async () => {
    await truffleAssert.passes(instance.withdrawAll({ from: ownerAddress }));
  });

  it('should reset balance after withdraw', async () => {
    await instance.withdrawAll({ from: ownerAddress });
    let contractBalance = parseFloat((await instance.balance()).toString());
    let blockchainBalance = parseFloat(
      await web3.eth.getBalance(instance.address)
    );

    assert(
      contractBalance === blockchainBalance && contractBalance === zeroAmount,
      'Balance not reset properly after withdraw.'
    );
  });

  it('should credit owner balance after withdraw', async () => {
    let ownerBalance = parseFloat(await web3.eth.getBalance(ownerAddress));
    await instance.withdrawAll({ from: ownerAddress });
    let newOwnerBalance = parseFloat(await web3.eth.getBalance(ownerAddress));

    assert(
      newOwnerBalance > ownerBalance,
      'Owner balance not credited properly after withdraw.'
    );
  });

  it('should not allow toss with under minimum payment', async () => {
    truffleAssert.fails(
      instance.toss({ from: foreignAddress, value: zeroAmount }),
      truffleAssert.ErrorType.REVERT
    );
  });

  it('should allow toss with sufficient payment', async () => {
    truffleAssert.passes(
      instance.toss({ from: foreignAddress, value: minimumAmount })
    );
  });
});
