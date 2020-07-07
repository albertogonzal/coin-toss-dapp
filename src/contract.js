const getContract = async () => {
  let contract;
  await $.getJSON('../build/contracts/CoinToss.json', (res) => {
    let address = res.networks[5777].address;
    let abi = res.abi;

    contract = {
      address,
      abi,
    };
  });

  return contract;
};

export { getContract };
