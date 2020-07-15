const getContractData = async () => {
  let contract;
  await $.getJSON('../build/contracts/CoinToss.json', (res) => {
    let address = {
      [3]: res.networks[3].address,
      [4]: res.networks[4].address,
      local: res.networks[5777].address,
    };
    let abi = res.abi;

    contract = {
      address,
      abi,
    };
  });

  return contract;
};

export { getContractData };
