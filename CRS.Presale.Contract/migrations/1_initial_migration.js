var Migrations = artifacts.require("./Migrations.sol");

var gasSettings = {
  gas: 8000000,
  gasPrice: 100000000000
};

module.exports = function (deployer) {
  deployer.deploy(Migrations, gasSettings);
};
