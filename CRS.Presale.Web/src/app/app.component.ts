import { Component, OnInit } from '@angular/core';
import * as Web3 from 'web3';
import { NotificationService } from './services/notification.service';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  public isLoading = false;

  public metamaskInstalled = true;
  public metamaskUnlocked = true;

  public pagePresale = 0;
  public pageBonus = 1;
  public pageHelp = 2;

  public activePage = 0;

  public currentPrice = 0;
  public isActive = false;
  public referralBonusSum = 0;
  public referralBonusHeight = 0;
  public numberOfReferrals = 0;
  public currentDiscountSum = 0;
  public referralPercentage = 0;
  public validReferralAddress = false;
  public nodesBoughtCount = 0;
  public isOwner = false;
  public affiliateBonusApplied = false;

  public childReferrals: any;

  // check if we were called with an affiliate link
  public affiliate: string = null;

  // generated affiliate links after buying
  public generatedAffiliateLink: string;

  public get validAffiliateLink(): boolean {
    return this.generatedAffiliateLink && this.generatedAffiliateLink !== null && this.generatedAffiliateLink.length > 0;
  }

  public get currentAccountAffiliateLink(): string {
    return environment.baseUrl + "?bonus=" + this.accounts[0];
  }

  public destinationAddress: string;

  public priceToSet: number;
  public withdrawalAmount: number;

  private web3: Web3;

  private ethPrecision = 10 ** 18;

  private gasPriceWei = 10000000000;

  private contract: Web3.eth.Contract;
  private accounts: Web3.eth.Account[];

  readonly contractAbi = [
    {
      "constant": true,
      "inputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "currentReferralCommissionPercentages",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "isActive",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "referralBonusMaxDepth",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "isOwner",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "overallDiscountSum",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "currentPrice",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "currentDiscountSum",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "currentReferralBuyerDiscountPercentage",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "referralsEnabled",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "payable": true,
      "stateMutability": "payable",
      "type": "fallback"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "buyer",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "price",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "coinsTargetAddress",
          "type": "string"
        },
        {
          "indexed": false,
          "name": "referral",
          "type": "bool"
        }
      ],
      "name": "MasternodeSold",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "price",
          "type": "uint256"
        }
      ],
      "name": "MasternodePriceChanged",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "buyer",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "parent",
          "type": "address"
        }
      ],
      "name": "ReferralAdded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "coinsTargetAddress",
          "type": "string"
        }
      ],
      "name": "buyMasternode",
      "outputs": [],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "coinsTargetAddress",
          "type": "string"
        },
        {
          "name": "referral",
          "type": "address"
        }
      ],
      "name": "buyMasternodeReferral",
      "outputs": [],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "active",
          "type": "bool"
        }
      ],
      "name": "setActiveState",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "price",
          "type": "uint256"
        }
      ],
      "name": "setPrice",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_referralsEnabled",
          "type": "bool"
        }
      ],
      "name": "setReferralsEnabledState",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "level",
          "type": "uint256"
        },
        {
          "name": "percentage",
          "type": "uint256"
        }
      ],
      "name": "setReferralCommissionPercentageLevel",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "depth",
          "type": "uint256"
        }
      ],
      "name": "setReferralBonusMaxDepth",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "percentage",
          "type": "uint256"
        }
      ],
      "name": "setReferralBuyerDiscountPercentage",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "addr",
          "type": "address"
        }
      ],
      "name": "addReferralAddress",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "addr",
          "type": "address"
        }
      ],
      "name": "removeReferralAddress",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "withdraw",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "withdrawReferralBonus",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "addr",
          "type": "address"
        }
      ],
      "name": "checkReferralBonusHeight",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "addr",
          "type": "address"
        }
      ],
      "name": "getNrOfReferrals",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "addr",
          "type": "address"
        }
      ],
      "name": "getReferralBonusSum",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "addr",
          "type": "address"
        }
      ],
      "name": "getReferralChildren",
      "outputs": [
        {
          "name": "",
          "type": "address[]"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "addr",
          "type": "address"
        },
        {
          "name": "idx",
          "type": "uint256"
        }
      ],
      "name": "getReferralChild",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "addr",
          "type": "address"
        }
      ],
      "name": "isValidReferralAddress",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "addr",
          "type": "address"
        }
      ],
      "name": "getNodesBoughtCountForAddress",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "getDiscountedNodePrice",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }
  ];

  readonly contractAddress = "<insert-contract-address-here>";

  constructor(
    private notificationService: NotificationService,
    private route: ActivatedRoute) {

    // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
    this.web3 = new Web3(Web3.givenProvider);
  }

  async ngOnInit() {
    try {
      this.isLoading = true;

      if (typeof this.web3 === 'undefined') {
        console.error('No Web3 found, get Metamask!');
        await this.notificationService.notifyError('No Web3 found, get Metamask!');

        this.metamaskInstalled = false;

        return;
      } else {
        console.log('Web3 found!');

        // update the accounts every time the user changes his main account
        if (this.web3.currentProvider &&
          this.web3.currentProvider.publicConfigStore &&
          this.web3.currentProvider.publicConfigStore !== null) {

          this.web3.currentProvider.publicConfigStore.on('update', async () => {
            const newAccounts = await this.web3.eth.getAccounts();
            if (this.accounts && this.accounts.length > 0 && this.accounts[0] &&
              newAccounts && newAccounts.length > 0 && newAccounts[0] &&
              this.accounts[0] !== newAccounts[0]) {
              window.location.reload();
            }
          });
        }
      }

      this.web3.eth.net.getId().then(id => console.log(`You are connected to network: ${this.getNet(id)}`));

      this.web3.eth.getGasPrice((e, r) => {
        console.log("current gas price: " + r);

        if (r && r !== null && r > 1000000000) {
          this.gasPriceWei = r * 3;
        }
      });

      this.accounts = await this.web3.eth.getAccounts();

      if (!this.accounts || this.accounts === null || this.accounts.length === 0) {
        console.error('Metamask not unlocked!');
        await this.notificationService.notifyError('Please unlock your Metamask wallet!');

        this.metamaskUnlocked = false;

        return;
      }

      this.contract = new this.web3.eth.Contract(this.contractAbi, this.contractAddress);

      // refresh the page if the price was changed in the meantime
      this.contract.events.MasternodePriceChanged({}, async (error, result) => {
        if (!error) {
          window.location.reload();
        } else {
          // log error here
          console.log(error);
        }
      });

      this.route.queryParams.subscribe(params => {
        const affiliate = params['bonus'];

        if (affiliate && affiliate !== null && affiliate.length === 42 && affiliate !== this.accounts[0]) {
          console.log("taking bonus address: ", affiliate);
          this.affiliate = affiliate;
        }
      });

      await this.fetchCurrentValues();

      // console.log(this);
    } catch (ex) {
      console.error("exception while initializing the app", ex);
      await this.notificationService.notifyError('An internal error occured please try again later.');

      this.metamaskInstalled = false;
    } finally {
      this.isLoading = false;
    }
  }

  public async buyMasternode() {

    if (!this.destinationAddress || this.destinationAddress === null ||
      this.destinationAddress.length < 30 || this.destinationAddress.length > 40) {
      await this.notificationService.notifyError('Invalid destination address - please check.');
      return;
    }

    try {
      if (this.isLoading) {
        return;
      }

      this.isLoading = true;

      const tx = { from: this.accounts[0], value: this.currentPrice * this.ethPrecision, gasPrice: this.gasPriceWei };

      if (this.affiliate && this.affiliate != null && this.affiliate.length === 42) {
        const buyResult = await this.contract.methods.buyMasternodeReferral(this.destinationAddress, this.affiliate).send(tx);
        console.log("buyResult bonus", buyResult);
      } else {
        const buyResult = await this.contract.methods.buyMasternode(this.destinationAddress).send(tx);
        console.log("buyResult", buyResult);
      }

      // not really needed here since we work with the corresponding event but better once more ;)
      await this.fetchCurrentValues();

      await this.notificationService.notify('You successfully bought a masternode - your coins will be available soon. Thank you!');

      // show affiliate link
      this.generatedAffiliateLink = this.currentAccountAffiliateLink;
    } catch (ex) {
      console.error("exception while buying", ex);
      await this.notificationService.notifyError('An error while placing your buy order occured - please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  public async fetchCurrentValues() {
    try {
      this.isLoading = true;

      this.validReferralAddress = await this.contract.methods.isValidReferralAddress(this.accounts[0]).call();

      if (this.affiliate && this.affiliate !== null && this.affiliate.length > 40 &&
        (await this.contract.methods.isValidReferralAddress(this.affiliate).call())) {
        this.currentPrice = (await this.contract.methods.getDiscountedNodePrice().call()) / this.ethPrecision;
        this.affiliateBonusApplied = true;
      } else {
        this.currentPrice = (await this.contract.methods.currentPrice().call()) / this.ethPrecision;
      }

      this.isActive = await this.contract.methods.isActive().call();
      this.isOwner = await this.contract.methods.owner().call() === this.accounts[0];

      this.nodesBoughtCount = await this.contract.methods.getNodesBoughtCountForAddress(this.accounts[0]).call();
      this.referralBonusSum = (await this.contract.methods.getReferralBonusSum(this.accounts[0]).call()) / this.ethPrecision;

      if (this.referralBonusSum > 0) {
        this.referralBonusHeight = (await this.contract.methods.checkReferralBonusHeight(this.accounts[0]).call()) / this.ethPrecision;
        this.numberOfReferrals = await this.contract.methods.getNrOfReferrals(this.accounts[0]).call();

        const children = await this.contract.methods.getReferralChildren(this.accounts[0]).call();

        // fetch downline
        const childReferrals = [];
        children.forEach(async (childAddress) => {
          const cnt = await this.contract.methods.getNrOfReferrals(childAddress).call();
          childReferrals.push({
            address: childAddress,
            referralCount: cnt
          });
        });
        this.childReferrals = childReferrals;
      }

      if (this.isOwner) {
        this.currentDiscountSum = (await this.contract.methods.currentDiscountSum().call()) / this.ethPrecision;
      }

    } catch (ex) {
      console.error("exception while fetching current values", ex);
      await this.notificationService.notifyError('An internal error occured - please reaload the page.');
    } finally {
      this.isLoading = false;
    }
  }

  public async changePresaleState() {
    try {
      if (this.isLoading) {
        return;
      }

      this.isLoading = true;

      const result = await this.contract.methods.setActiveState(!this.isActive)
        .send({ from: this.accounts[0], gasPrice: this.gasPriceWei });
      console.log("changePresaleState result", result);

      await this.fetchCurrentValues();

      await this.notificationService.notify('Presale state changed.');
    } catch (ex) {
      console.error("exception while changing presale state", ex);
      await this.notificationService.notifyError('An error while changing the presale state occured - please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  public async setPrice() {
    try {
      if (this.isLoading) {
        return;
      }

      this.isLoading = true;

      const result = await this.contract.methods
        .setPrice(this.web3.utils.toWei(this.priceToSet.toString(), 'ether'))
        .send({ from: this.accounts[0], gasPrice: this.gasPriceWei });

      console.log("setPrice result", result);

      await this.fetchCurrentValues();

      await this.notificationService.notify('Price set.');
    } catch (ex) {
      console.error("exception while setting the price", ex);
      await this.notificationService.notifyError('An error while setting the price occured - please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  public async withdraw() {
    try {
      if (this.isLoading) {
        return;
      }

      this.isLoading = true;

      const result = await this.contract.methods
        .withdraw(this.web3.utils.toWei(this.withdrawalAmount.toString(), 'ether'))
        .send({ from: this.accounts[0], gasPrice: this.gasPriceWei });

      console.log("withdraw result", result);

      await this.fetchCurrentValues();

      await this.notificationService.notify('Withdrawal done.');
    } catch (ex) {
      console.error("exception while withdrawing", ex);
      await this.notificationService.notifyError('An error while withdrawing occured - please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  public async withdrawReferralBonus() {
    try {
      if (this.isLoading) {
        return;
      }

      this.isLoading = true;

      const result = await this.contract.methods
        .withdrawReferralBonus()
        .send({ from: this.accounts[0], gasPrice: this.gasPriceWei });

      console.log("withdraw withdrawReferralBonus", result);

      await this.fetchCurrentValues();

      await this.notificationService.notify('withdrawal referral bonus done.');
    } catch (ex) {
      console.error("exception while withdrawing referral bonus", ex);
      await this.notificationService.notifyError('An error while withdrawing referral bonus occured - please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  public copyAffiliateLink() {
    this.copyToClipboard(this.currentAccountAffiliateLink);
  }

  public reload() {
    window.location.reload();
  }

  private getNet(id: number): string {
    const networks = {
      1: 'mainnet',
      3: 'ropsten',
      4: 'rinkeby',
      42: 'koven'
    };
    return networks[id];
  }

  private copyToClipboard(item) {
    document.addEventListener('copy', (e: ClipboardEvent) => {
      e.clipboardData.setData('text/plain', (item));
      e.preventDefault();
      document.removeEventListener('copy', null);
    });
    document.execCommand('copy');
  }
}
