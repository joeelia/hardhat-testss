require("@nomiclabs/hardhat-waffle");
// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.13"
      },
      {
        version: "0.5.0"
      }
    ],
  },
  networks: {
    hardhat: {
      loggingEnabled: true,
      chainId: 1337,
      allowUnlimitedContractSize: true,
      timeout: 5000,
      mining: {
        auto: false,
        interval: 2,
        mempool: {
          order: "fifo",
        },
      },
    },
  }
};
/*
networks: {
  hardhat: {
    loggingEnabled: false,
    chainId: 1337,
    forking: {
      enabled: false,
      url: "https://eth-mainnet.alchemyapi.io/v2/28rytj1G7gNlL-EBF6WE4xKfAV-2W7N8",
      blockNumber: 14494740
    },
    allowUnlimitedContractSize: true,
    timeout: 5000,
    mining: {
      auto: false,
      interval: 200,
      mempool: {
        order: "fifo",
      },
    },
  },
}
*/