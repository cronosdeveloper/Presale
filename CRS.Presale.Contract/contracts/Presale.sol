pragma solidity ^0.4.24;

import "./ownership/Ownable.sol";
import "./math/SafeMath.sol";
import "./utils/ReentrancyGuard.sol";

/**
 * @title Presale Contract
 * @dev Implementation of a presale contract on the Ethereum chain
 */
contract Presale is Ownable, ReentrancyGuard {
  using SafeMath for uint256;

  struct ReferralData {
    uint256 referrals; // number of referrals
    uint256 bonusSum;  // sum of all bonuses - this is just for showing the total amount - for payouts the referralBonuses mapping will be used
    address[] children; // child referrals
  }

  uint256 public currentPrice = 0;

  bool public isActive = false;

  uint256 public currentDiscountSum = 0;                       // current sum of all discounts (have to stay in the contract for payout)
  uint256 public overallDiscountSum = 0;                       // sum of all discounts given since beginning

  bool public referralsEnabled = true;                      // are referrals enabled in general

  mapping(address => uint) private referralBonuses;

  uint256 public referralBonusMaxDepth = 3;                                  // used to ensure the max depth
  mapping(uint256 => uint) public currentReferralCommissionPercentages;      // commission levels
  uint256 public currentReferralBuyerDiscountPercentage = 5;                 // discount percentage if a buyer uses a valid affiliate link

  mapping(address => address) private parentReferrals;    // parent relationship
  mapping(address => ReferralData) private referralData;  // referral data for this address
  mapping(address => uint) private nodesBought;           // number of bought nodes

  mapping(address => bool) private manuallyAddedReferrals; // we need a chance to add referrals manually since this is needed for promotion

  event MasternodeSold(address buyer, uint256 price, string coinsTargetAddress, bool referral);
  event MasternodePriceChanged(uint256 price);
  event ReferralAdded(address buyer, address parent);

  constructor() public {
    currentReferralCommissionPercentages[0] = 10;
    currentReferralCommissionPercentages[1] = 5;
    currentReferralCommissionPercentages[2] = 3;
  }

  function () external payable {
      // nothing to do
  }

  function buyMasternode(string memory coinsTargetAddress) public nonReentrant payable {
    _buyMasternode(coinsTargetAddress, false, owner());
  }

  function buyMasternodeReferral(string memory coinsTargetAddress, address referral) public nonReentrant payable {
    _buyMasternode(coinsTargetAddress, referralsEnabled, referral);
  }

  function _buyMasternode(string memory coinsTargetAddress, bool useReferral, address referral) internal {
    require(isActive, "Buying is currently deactivated.");
    require(currentPrice > 0, "There was no MN price set so far.");

    uint256 nodePrice = currentPrice;

    // nodes can be bought cheaper if the user uses a valid referral address
    if (useReferral && isValidReferralAddress(referral)) {
      nodePrice = getDiscountedNodePrice();
    }

    require(msg.value >= nodePrice, "Sent amount of ETH was too low.");

    // check target address
    uint256 length = bytes(coinsTargetAddress).length;
    require(length >= 30 && length <= 42 , "Coins target address invalid");

    if (useReferral && isValidReferralAddress(referral)) {

      require(msg.sender != referral, "You can't be your own referral.");

      // set parent/child relations (only if there is no connection/parent yet available)
      // --> this also means that a referral structure can't be changed
      address parent = parentReferrals[msg.sender];
      if (referralData[parent].referrals == 0) {
        referralData[referral].referrals = referralData[referral].referrals.add(1);
        referralData[referral].children.push(msg.sender);
        parentReferrals[msg.sender] = referral;
      }

      // iterate over commissionLevels and calculate commissions
      uint256 discountSumForThisPayment = 0;
      address currentReferral = referral;

      for (uint256 level=0; level < referralBonusMaxDepth; level++) {
        // only apply discount if referral address is valid (or as long we can step up the hierarchy)
        if(isValidReferralAddress(currentReferral)) {

          require(msg.sender != currentReferral, "Invalid referral structure (you can't be in your own tree)");

          // do not take node price here since it could be already dicounted
          uint256 referralBonus = currentPrice.div(100).mul(currentReferralCommissionPercentages[level]);

          // set payout bonus
          referralBonuses[currentReferral] = referralBonuses[currentReferral].add(referralBonus);

          // set stats/counters
          referralData[currentReferral].bonusSum = referralData[currentReferral].bonusSum.add(referralBonus);
          discountSumForThisPayment = discountSumForThisPayment.add(referralBonus);

          // step up one hierarchy level
          currentReferral = parentReferrals[currentReferral];
        } else {
          // we can't find any parent - stop hierarchy calculation
          break;
        }
      }

      require(discountSumForThisPayment < nodePrice, "Wrong calculation of bonuses/discounts - would be higher than the price itself");

      currentDiscountSum = currentDiscountSum.add(discountSumForThisPayment);
      overallDiscountSum = overallDiscountSum.add(discountSumForThisPayment);
    }

    // set the node bought counter
    nodesBought[msg.sender] = nodesBought[msg.sender].add(1);

    emit MasternodeSold(msg.sender, currentPrice, coinsTargetAddress, useReferral);
  }

  function setActiveState(bool active) public onlyOwner {
    isActive = active;
  }

  function setPrice(uint256 price) public onlyOwner {
    require(price > 0, "Price has to be greater than zero.");

    currentPrice = price;

    emit MasternodePriceChanged(price);
  }

  function setReferralsEnabledState(bool _referralsEnabled) public onlyOwner {
    referralsEnabled = _referralsEnabled;
  }

  function setReferralCommissionPercentageLevel(uint256 level, uint256 percentage) public onlyOwner {
    require(percentage >= 0 && percentage <= 20, "Percentage has to be between 0 and 20.");
    require(level >= 0 && level < referralBonusMaxDepth, "Invalid depth level");

    currentReferralCommissionPercentages[level] = percentage;
  }

  function setReferralBonusMaxDepth(uint256 depth) public onlyOwner {
    require(depth >= 0 && depth <= 10, "Referral bonus depth too high.");

    referralBonusMaxDepth = depth;
  }

  function setReferralBuyerDiscountPercentage(uint256 percentage) public onlyOwner {
    require(percentage >= 0 && percentage <= 20, "Percentage has to be between 0 and 20.");

    currentReferralBuyerDiscountPercentage = percentage;
  }

  function addReferralAddress(address addr) public onlyOwner {
    manuallyAddedReferrals[addr] = true;
  }

  function removeReferralAddress(address addr) public onlyOwner {
    manuallyAddedReferrals[addr] = false;
  }

  function withdraw(uint256 amount) public onlyOwner {
    owner().transfer(amount);
  }

  function withdrawReferralBonus() public nonReentrant returns (bool) {
    uint256 amount = referralBonuses[msg.sender];

    if (amount > 0) {
        referralBonuses[msg.sender] = 0;
        currentDiscountSum = currentDiscountSum.sub(amount);

        if (!msg.sender.send(amount)) {
            referralBonuses[msg.sender] = amount;
            currentDiscountSum = currentDiscountSum.add(amount);

            return false;
        }
    }

    return true;
  }

  function checkReferralBonusHeight(address addr) public view returns (uint) {
      return referralBonuses[addr];
  }

  function getNrOfReferrals(address addr) public view returns (uint) {
      return referralData[addr].referrals;
  }

  function getReferralBonusSum(address addr) public view returns (uint) {
      return referralData[addr].bonusSum;
  }

  function getReferralChildren(address addr) public view returns (address[] memory) {
      return referralData[addr].children;
  }

  function getReferralChild(address addr, uint256 idx) public view returns (address) {
      return referralData[addr].children[idx];
  }

  function isValidReferralAddress(address addr) public view returns (bool) {
      return nodesBought[addr] > 0 || manuallyAddedReferrals[addr] == true;
  }

  function getNodesBoughtCountForAddress(address addr) public view returns (uint256) {
      return nodesBought[addr];
  }

  function getDiscountedNodePrice() public view returns (uint256) {
      return currentPrice.sub(currentPrice.div(100).mul(currentReferralBuyerDiscountPercentage));
  }
}
