var Presale = artifacts.require("Presale");

var gasSettings = {
  gas: 7000000,
  gasPrice: 100000000000
};

module.exports = function (deployer) {
  deployer.deploy(Presale, gasSettings);
};
