const Presale = artifacts.require("Presale");

contract('Presale', async (accounts) => {

  const testAddress = "AVyEPv3aAKhrzHSyvuyiiJRgPTRr1fG97u";
  const initialReferralPercentageLevel1 = 10;
  const initialReferralPercentageLevel2 = 5;
  const initialReferralPercentageLevel3 = 3;
  const initialReferralBuyerDiccountPercentage = 5;


  // the resulting referral structure looks like this
  //                     -> 8
  //                    /
  // 1 --> 2 --> 3 --> 4 --> 5 --> 6
  //                    \
  //                     -> 7
  // 9 --> 10 (manually)

  it("1 owner is account 0", async () => {
    const sut = await Presale.deployed();

    assert(await sut.owner.call() == accounts[0], "Wrong contract owner!");
  });

  it("2 buying when inactive should fail", async () => {
    const sut = await Presale.deployed();

    try {
      const tx = { from: accounts[1], value: web3.toWei(1, "ether") };
      await sut.buyMasternode.sendTransaction(testAddress, tx);
      assert.fail();
    } catch (error) {
      assert(error.toString().includes('Buying is currently deactivated'), error.toString());
    }
  });

  it("3 activate with wrong address should fail", async () => {
    const sut = await Presale.deployed();

    try {
      const tx = { from: accounts[1] };
      await sut.setActiveState.sendTransaction(true, tx);
      assert.fail();
    } catch (error) {
      assert(!error.toString().includes('assert.fail()'), "assert is not allowed to fail in try-part!");
    }
  });

  it("4 activate with correct address should work", async () => {
    const sut = await Presale.deployed();

    const tx = { from: accounts[0] };
    await sut.setActiveState.sendTransaction(true, tx);
  });

  it("5 buy without price set should fail", async () => {
    const sut = await Presale.deployed();

    try {
      const tx = { from: accounts[1], value: web3.toWei(1, "ether") };
      await sut.buyMasternode.sendTransaction(testAddress, tx);
      assert.fail();
    } catch (error) {
      assert(error.toString().includes('There was no MN price set so far'), error.toString());
    }
  });

  it("6 set price with wrong address (not owner) should fail", async () => {
    const sut = await Presale.deployed();

    try {
      const tx = { from: accounts[1] };
      await sut.setPrice.sendTransaction(web3.toWei(1, "ether"), tx);
      assert.fail();
    } catch (error) {
      assert(!error.toString().includes('assert.fail()'), "assert is not allowed to fail in try-part!");
    }
  });

  it("7 set price with correct address should work", async () => {
    const sut = await Presale.deployed();

    const tx = { from: accounts[0] };
    await sut.setPrice.sendTransaction(web3.toWei(1, "ether"), tx);

    // console.log((await sut.currentPrice.call()).toNumber());

    assert(await sut.currentPrice.call() == web3.toWei(1, "ether"), 'Price was not set correctly');
  });

  it("8 buying with too less eth sent in the tx should fail", async () => {
    const sut = await Presale.deployed();

    try {
      const tx = { from: accounts[1], value: web3.toWei(0.5, "ether") };
      await sut.buyMasternode.sendTransaction(testAddress, tx);
      assert.fail();
    } catch (error) {
      assert(error.toString().includes('Sent amount of ETH was too low'), error.toString());
    }
  });

  it("9 buying should work", async () => {
    const sut = await Presale.deployed();

    const tx = { from: accounts[1], value: web3.toWei(1, "ether") };
    await sut.buyMasternode.sendTransaction(testAddress, tx);
  });

  it("10 buying with too many ETH should work", async () => {
    const sut = await Presale.deployed();

    const tx = { from: accounts[1], value: web3.toWei(2, "ether") };
    await sut.buyMasternode.sendTransaction(testAddress, tx);
  });

  it("11 buying with wrong target address (zero length) should fail", async () => {
    const sut = await Presale.deployed();

    try {
      const tx = { from: accounts[1], value: web3.toWei(1, "ether") };
      await sut.buyMasternode.sendTransaction("", tx);
      assert.fail();
    } catch (error) {
      assert(error.toString().includes('Coins target address invalid'), error.toString());
    }
  });

  it("12 buying with wrong target address (too long) should fail", async () => {
    const sut = await Presale.deployed();

    try {
      const tx = { from: accounts[1], value: web3.toWei(1, "ether") };
      await sut.buyMasternode.sendTransaction(testAddress + "+" + testAddress, tx);
      assert.fail();
    } catch (error) {
      assert(error.toString().includes('Coins target address invalid'), error.toString());
    }
  });

  it("13 withdrawal from wrong address should fail", async () => {
    const sut = await Presale.deployed();

    try {
      const tx = { from: accounts[1] };
      await sut.withdraw.sendTransaction(tx);
      assert.fail();
    } catch (error) {
      assert(!error.toString().includes('assert.fail()'), "assert is not allowed to fail in try-part!");
    }
  });

  it("14 withdrawal from owner address should work", async () => {
    const sut = await Presale.deployed();

    const tx = { from: accounts[0] };
    await sut.withdraw.sendTransaction(web3.toWei(2.5, "ether"), tx);
  });

  it("15 withdrawal with invalid amount from owner address should fail", async () => {
    const sut = await Presale.deployed();

    try {
      const tx = { from: accounts[0] };
      await sut.withdraw.sendTransaction(web3.toWei(5, "ether"), tx);
      assert.fail();
    } catch (error) {
      assert(!error.toString().includes('assert.fail()'), "assert is not allowed to fail in try-part!");
    }
  });

  it("16 activate referrals with wrong address should fail", async () => {
    const sut = await Presale.deployed();

    try {
      const tx = { from: accounts[1] };
      await sut.setReferralsEnabledState.sendTransaction(true, tx);
      assert.fail();
    } catch (error) {
      assert(!error.toString().includes('assert.fail()'), "assert is not allowed to fail in try-part!");
    }
  });

  it("17 activate referrals with correct address should work", async () => {
    const sut = await Presale.deployed();

    const tx = { from: accounts[0] };
    await sut.setReferralsEnabledState.sendTransaction(true, tx);
  });

  it("18 check initial referral and buyer percentages", async () => {
    const sut = await Presale.deployed();

    let percentage = await sut.currentReferralCommissionPercentages.call(0);
    assert(percentage == initialReferralPercentageLevel1, "Initial referral percentage level 1 is incorrect!");

    percentage = await sut.currentReferralCommissionPercentages.call(1);
    assert(percentage == initialReferralPercentageLevel2, "Initial referral percentage level 2 is incorrect!");

    percentage = await sut.currentReferralCommissionPercentages.call(2);
    assert(percentage == initialReferralPercentageLevel3, "Initial referral percentage level 3 is incorrect!");

    percentage = await sut.currentReferralBuyerDiscountPercentage.call();
    assert(percentage == initialReferralBuyerDiccountPercentage, "Initial referral buyer discount percentage is incorrect!");
  });

  it("19 set referral percentage with wrong address (not owner) should fail", async () => {
    const sut = await Presale.deployed();

    try {
      const tx = { from: accounts[1] };
      await sut.setReferralCommissionPercentageLevel.sendTransaction(0, 15, tx);
      assert.fail();
    } catch (error) {
      assert(!error.toString().includes('assert.fail()'), "assert is not allowed to fail in try-part!");
    }
  });

  it("20 set referral percentage with invalid level should fail", async () => {
    const sut = await Presale.deployed();

    try {
      const tx = { from: accounts[1] };
      await sut.setReferralCommissionPercentageLevel.sendTransaction(3, 5, tx);
      assert.fail();
    } catch (error) {
      assert(!error.toString().includes('assert.fail()'), "assert is not allowed to fail in try-part!");
    }
  });

  it("21 set referral percentage with invalid percentage amount (<= 20) should fail", async () => {
    const sut = await Presale.deployed();

    try {
      const tx = { from: accounts[1] };
      await sut.setReferralCommissionPercentageLevel.sendTransaction(2, 50, tx);
      assert.fail();
    } catch (error) {
      assert(!error.toString().includes('assert.fail()'), "assert is not allowed to fail in try-part!");
    }
  });

  it("22 set referral percentage with correct address should work", async () => {
    const sut = await Presale.deployed();

    const tx = { from: accounts[0] };
    await sut.setReferralCommissionPercentageLevel.sendTransaction(0, 15, tx);

    assert(await sut.currentReferralCommissionPercentages.call(0) == 15, 'Referral percentage was not set correctly');
  });

  it("23 set referral max bonus depth with wrong address (not owner) should fail", async () => {
    const sut = await Presale.deployed();

    try {
      const tx = { from: accounts[1] };
      await sut.setReferralBonusMaxDepth.sendTransaction(3, tx);
      assert.fail();
    } catch (error) {
      assert(!error.toString().includes('assert.fail()'), "assert is not allowed to fail in try-part!");
    }
  });

  it("24 set referral max bonus depth with invalid value should fail: 20", async () => {
    const sut = await Presale.deployed();

    try {
      const tx = { from: accounts[1] };
      await sut.setReferralBonusMaxDepth.sendTransaction(20, tx);
      assert.fail();
    } catch (error) {
      assert(!error.toString().includes('assert.fail()'), "assert is not allowed to fail in try-part!");
    }
  });

  it("25 set referral max bonus depth with invalid value should fail: -1", async () => {
    const sut = await Presale.deployed();

    try {
      const tx = { from: accounts[1] };
      await sut.setReferralBonusMaxDepth.sendTransaction(-1, tx);
      assert.fail();
    } catch (error) {
      assert(!error.toString().includes('assert.fail()'), "assert is not allowed to fail in try-part!");
    }
  });

  it("26 set referral max bonus depth with correct address should work", async () => {
    const sut = await Presale.deployed();

    assert(await sut.referralBonusMaxDepth.call() == 3, "Wrong value for referralBonusMaxDepth!");

    const tx = { from: accounts[0] };
    await sut.setReferralBonusMaxDepth.sendTransaction(4, tx);

    assert(await sut.referralBonusMaxDepth.call() == 4, "Wrong value for referralBonusMaxDepth!");
  });

  it("27 set referral buyer discount percentage with wrong address (not owner) should fail", async () => {
    const sut = await Presale.deployed();

    try {
      const tx = { from: accounts[1] };
      await sut.setReferralBuyerDiscountPercentage.sendTransaction(3, tx);
      assert.fail();
    } catch (error) {
      assert(!error.toString().includes('assert.fail()'), "assert is not allowed to fail in try-part!");
    }
  });

  it("28 set referral buyer discount percentage with invalid value should fail: 20", async () => {
    const sut = await Presale.deployed();

    try {
      const tx = { from: accounts[1] };
      await sut.setReferralBuyerDiscountPercentage.sendTransaction(25, tx);
      assert.fail();
    } catch (error) {
      assert(!error.toString().includes('assert.fail()'), "assert is not allowed to fail in try-part!");
    }
  });

  it("29 set referral buyer discount percentage with invalid value should fail: -1", async () => {
    const sut = await Presale.deployed();

    try {
      const tx = { from: accounts[1] };
      await sut.setReferralBuyerDiscountPercentage.sendTransaction(-1, tx);
      assert.fail();
    } catch (error) {
      assert(!error.toString().includes('assert.fail()'), "assert is not allowed to fail in try-part!");
    }
  });

  it("30 set referral buyer discount percentage with correct address should work", async () => {
    const sut = await Presale.deployed();

    const tx = { from: accounts[0] };
    await sut.setReferralBuyerDiscountPercentage.sendTransaction(4, tx);

    assert(await sut.currentReferralBuyerDiscountPercentage.call() == 4, "Wrong value for referral buyer discount percentage!");
  });

  it("31 set referral bonus level for 4th level (related to testcase 26) should work", async () => {
    const sut = await Presale.deployed();

    const tx = { from: accounts[0] };
    await sut.setReferralCommissionPercentageLevel.sendTransaction(3, 5, tx);
  });

  it("32 check referral and buyer percentages", async () => {
    const sut = await Presale.deployed();

    let percentage = await sut.currentReferralCommissionPercentages.call(0);
    assert(percentage == 15, "Referral percentage level 1 is incorrect!");

    percentage = await sut.currentReferralCommissionPercentages.call(1);
    assert(percentage == initialReferralPercentageLevel2, "Referral percentage level 2 is incorrect!");

    percentage = await sut.currentReferralCommissionPercentages.call(2);
    assert(percentage == initialReferralPercentageLevel3, "Referral percentage level 3 is incorrect!");

    percentage = await sut.currentReferralCommissionPercentages.call(3);
    assert(percentage == 5, "Referral percentage level 4 is incorrect!");

    percentage = await sut.currentReferralBuyerDiscountPercentage.call();
    assert(percentage == 4, "Referral buyer discount percentage is incorrect!");
    assert(await sut.getDiscountedNodePrice.call() == web3.toWei(0.96, "ether"), "Invalid discounted node price!");
  });

  it("33 buying with invalid referral (buy should work but no commission)", async () => {
    const sut = await Presale.deployed();

    const tx = { from: accounts[1], value: web3.toWei(1, "ether") };
    await sut.buyMasternodeReferral.sendTransaction(testAddress, accounts[2], tx);

    const bonusHeight = await sut.checkReferralBonusHeight.call(accounts[2]);

    assert(bonusHeight == 0, "Invalid bonus height!");
  });

  it("34 buying with invalid referral but discounted node price (buy should not work and no commission)", async () => {
    const sut = await Presale.deployed();

    try {
      const discountedPrice = await sut.getDiscountedNodePrice.call();

      const tx = { from: accounts[1], value: discountedPrice };
      await sut.buyMasternodeReferral.sendTransaction(testAddress, accounts[2], tx);
      assert.fail();
    } catch (error) {
      assert(!error.toString().includes('assert.fail()'), "assert is not allowed to fail in try-part!");

      const bonusHeight = await sut.checkReferralBonusHeight.call(accounts[2]);
      assert(bonusHeight == 0, "Invalid bonus height!");
    }
  });

  it("35 check for valid referral address", async () => {
    const sut = await Presale.deployed();

    assert(await sut.isValidReferralAddress.call(accounts[0]) == false, "Invalid referral address state!");
    assert(await sut.isValidReferralAddress.call(accounts[1]) == true, "Invalid referral address state!");
    assert(await sut.isValidReferralAddress.call(accounts[2]) == false, "Invalid referral address state!");
  });

  it("36 buying with valid referral (with commission on first level)", async () => {
    const sut = await Presale.deployed();

    const tx = { from: accounts[2], value: web3.toWei(1, "ether") };
    await sut.buyMasternodeReferral.sendTransaction(testAddress, accounts[1], tx);

    const bonusHeight = await sut.checkReferralBonusHeight.call(accounts[1]);
    // console.log("bonusHeight", bonusHeight.toNumber());

    assert(bonusHeight == web3.toWei(0.15, "ether"), "Invalid bonus height!");
  });

  it("37 check bonus, current and overall discount sum before withdraw", async () => {
    const sut = await Presale.deployed();

    const bonusSum = await sut.getReferralBonusSum.call(accounts[1]);
    // console.log("bonusHeight", bonusHeight.toNumber());

    assert(bonusSum == web3.toWei(0.15, "ether"), "Invalid bonus sum!");
    assert(await sut.currentDiscountSum.call() == web3.toWei(0.15, "ether"), "Invalid current discount sum!");
    assert(await sut.overallDiscountSum.call() == web3.toWei(0.15, "ether"), "Invalid overall discount sum!");
  });

  it("38 withdraw and check bonus sum and height", async () => {
    const sut = await Presale.deployed();

    const oldAmount = web3.eth.getBalance(accounts[1]).toNumber();

    const tx = { from: accounts[1] };
    await sut.withdrawReferralBonus.sendTransaction(tx);

    const newAmount = web3.eth.getBalance(accounts[1]).toNumber()

    assert(oldAmount < newAmount, 'Referral bonus not received.');

    const bonusSum = await sut.getReferralBonusSum.call(accounts[1]);
    const bonusHeight = await sut.checkReferralBonusHeight.call(accounts[1]);

    assert(bonusHeight == web3.toWei(0, "ether"), "Invalid bonus height!");
    assert(bonusSum == web3.toWei(0.15, "ether"), "Invalid bonus sum!");
    assert(await sut.currentDiscountSum.call() == web3.toWei(0, "ether"), "Invalid current discount sum!");
    assert(await sut.overallDiscountSum.call() == web3.toWei(0.15, "ether"), "Invalid overall discount sum!");
  });

  it("39 check for valid referral address", async () => {
    const sut = await Presale.deployed();

    assert(await sut.isValidReferralAddress.call(accounts[0]) == false, "Invalid referral address state!");
    assert(await sut.isValidReferralAddress.call(accounts[1]) == true, "Invalid referral address state!");
    assert(await sut.isValidReferralAddress.call(accounts[2]) == true, "Invalid referral address state!");
  });

  it("40 withdraw referral bonus for address 5 - should not change anything (except tx fees)", async () => {
    const sut = await Presale.deployed();

    const oldAmount = web3.eth.getBalance(accounts[5]).toNumber();

    const tx = { from: accounts[5] };
    await sut.withdrawReferralBonus.sendTransaction(tx);

    const newAmount = web3.eth.getBalance(accounts[5]).toNumber()

    assert(oldAmount >= newAmount, 'Referral bonus received with no reason.');

    const referralBonus = await sut.checkReferralBonusHeight.call(accounts[5]);
    assert(referralBonus == web3.toWei(0.0, "ether"), 'Wrong referral bonus.');
  });

  it("41 check nr of referrals", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getNrOfReferrals.call(accounts[0]) == 0, "Invalid number of referrals!");
    assert(await sut.getNrOfReferrals.call(accounts[1]) == 1, "Invalid number of referrals!");
    assert(await sut.getNrOfReferrals.call(accounts[2]) == 0, "Invalid number of referrals!");
  });

  it("42 check referral children", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getReferralChild.call(accounts[1], 0) == accounts[2], "Invalid referrals!");
  });

  it("43 check bought nodes", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getNodesBoughtCountForAddress.call(accounts[1]) == 3, "Invalid node bought count!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[2]) == 1, "Invalid node bought count!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[3]) == 0, "Invalid node bought count!");
  });

  // level 1,2
  it("44 buying with valid referral (with commission on first and second level) and applied discount", async () => {
    const sut = await Presale.deployed();

    const discountedPrice = await sut.getDiscountedNodePrice.call();

    const tx = { from: accounts[3], value: discountedPrice };
    await sut.buyMasternodeReferral.sendTransaction(testAddress, accounts[2], tx);

    assert(await sut.checkReferralBonusHeight.call(accounts[1]) == web3.toWei(initialReferralPercentageLevel2 / 100, "ether"), "Invalid bonus height!");
    assert(await sut.checkReferralBonusHeight.call(accounts[2]) == web3.toWei(0.15, "ether"), "Invalid bonus height!");

    assert(await sut.getReferralBonusSum.call(accounts[1]) == web3.toWei(0.2, "ether"), "Invalid bonus sum!");
    assert(await sut.getReferralBonusSum.call(accounts[2]) == web3.toWei(0.15, "ether"), "Invalid bonus sum!");

    assert(await sut.currentDiscountSum.call() == web3.toWei(0.2, "ether"), "Invalid current discount sum!");
    assert(await sut.overallDiscountSum.call() == web3.toWei(0.35, "ether"), "Invalid overall discount sum!");
  });

  it("45 check bought nodes", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getNodesBoughtCountForAddress.call(accounts[1]) == 3, "Invalid node bought count!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[2]) == 1, "Invalid node bought count!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[3]) == 1, "Invalid node bought count!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[4]) == 0, "Invalid node bought count!");
  });

  it("46 check nr of referrals", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getNrOfReferrals.call(accounts[0]) == 0, "Invalid number of referrals!");
    assert(await sut.getNrOfReferrals.call(accounts[1]) == 1, "Invalid number of referrals!");
    assert(await sut.getNrOfReferrals.call(accounts[2]) == 1, "Invalid number of referrals!");
    assert(await sut.getNrOfReferrals.call(accounts[3]) == 0, "Invalid number of referrals!");
  });

  it("47 check referral children", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getReferralChild.call(accounts[1], 0) == accounts[2], "Invalid referrals!");
    assert(await sut.getReferralChild.call(accounts[2], 0) == accounts[3], "Invalid referrals!");
  });

  // level 1,2,3
  it("48 buying with valid referral (with commission on first, second and third level) and applied discount", async () => {
    const sut = await Presale.deployed();

    const discountedPrice = await sut.getDiscountedNodePrice.call();

    const tx = { from: accounts[4], value: discountedPrice };
    await sut.buyMasternodeReferral.sendTransaction(testAddress, accounts[3], tx);

    assert(await sut.checkReferralBonusHeight.call(accounts[1]) == web3.toWei(0.08, "ether"), "Invalid bonus height 1!");
    assert(await sut.checkReferralBonusHeight.call(accounts[2]) == web3.toWei(0.2, "ether"), "Invalid bonus height 2!");
    assert(await sut.checkReferralBonusHeight.call(accounts[3]) == web3.toWei(0.15, "ether"), "Invalid bonus height 3!");

    assert(await sut.getReferralBonusSum.call(accounts[1]) == web3.toWei(0.23, "ether"), "Invalid bonus sum 1!");
    assert(await sut.getReferralBonusSum.call(accounts[2]) == web3.toWei(0.2, "ether"), "Invalid bonus sum 2!");
    assert(await sut.getReferralBonusSum.call(accounts[3]) == web3.toWei(0.15, "ether"), "Invalid bonus sum 3!");

    assert(await sut.currentDiscountSum.call() == web3.toWei(0.43, "ether"), "Invalid current discount sum!");
    assert(await sut.overallDiscountSum.call() == web3.toWei(0.58, "ether"), "Invalid overall discount sum!");
  });

  it("49 check bought nodes", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getNodesBoughtCountForAddress.call(accounts[1]) == 3, "Invalid node bought count 1!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[2]) == 1, "Invalid node bought count 2!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[3]) == 1, "Invalid node bought count 3!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[4]) == 1, "Invalid node bought count 4!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[5]) == 0, "Invalid node bought count 5!");
  });

  it("50 check nr of referrals", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getNrOfReferrals.call(accounts[0]) == 0, "Invalid number of referrals 0!");
    assert(await sut.getNrOfReferrals.call(accounts[1]) == 1, "Invalid number of referrals 1!");
    assert(await sut.getNrOfReferrals.call(accounts[2]) == 1, "Invalid number of referrals 2!");
    assert(await sut.getNrOfReferrals.call(accounts[3]) == 1, "Invalid number of referrals 3!");
    assert(await sut.getNrOfReferrals.call(accounts[4]) == 0, "Invalid number of referrals 4!");
  });

  it("51 check referral children", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getReferralChild.call(accounts[1], 0) == accounts[2], "Invalid referrals 1!");
    assert(await sut.getReferralChild.call(accounts[2], 0) == accounts[3], "Invalid referrals 2!");
    assert(await sut.getReferralChild.call(accounts[3], 0) == accounts[4], "Invalid referrals 3!");
  });

  it("52 withdraw all referral bonuses", async () => {
    const sut = await Presale.deployed();

    let oldAmount = web3.eth.getBalance(accounts[1]).toNumber();
    let tx = { from: accounts[1] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    let newAmount = web3.eth.getBalance(accounts[1]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 1.');

    oldAmount = web3.eth.getBalance(accounts[2]).toNumber();
    tx = { from: accounts[2] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    newAmount = web3.eth.getBalance(accounts[2]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 2.');

    oldAmount = web3.eth.getBalance(accounts[3]).toNumber();
    tx = { from: accounts[3] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    newAmount = web3.eth.getBalance(accounts[3]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 3.');

    assert(await sut.checkReferralBonusHeight.call(accounts[1]) == web3.toWei(0, "ether"), "Invalid bonus height 1!");
    assert(await sut.checkReferralBonusHeight.call(accounts[2]) == web3.toWei(0, "ether"), "Invalid bonus height 2!");
    assert(await sut.checkReferralBonusHeight.call(accounts[3]) == web3.toWei(0, "ether"), "Invalid bonus height 3!");

    assert(await sut.getReferralBonusSum.call(accounts[1]) == web3.toWei(0.23, "ether"), "Invalid bonus sum 1!");
    assert(await sut.getReferralBonusSum.call(accounts[2]) == web3.toWei(0.2, "ether"), "Invalid bonus sum 2!");
    assert(await sut.getReferralBonusSum.call(accounts[3]) == web3.toWei(0.15, "ether"), "Invalid bonus sum 3!");

    assert(await sut.currentDiscountSum.call() == web3.toWei(0, "ether"), "Invalid current discount sum!");
    assert(await sut.overallDiscountSum.call() == web3.toWei(0.58, "ether"), "Invalid overall discount sum!");
  });

  // level 1,2,3,4
  it("53 buying with valid referral (with commission on first, second, third and fourth level) and applied discount", async () => {
    const sut = await Presale.deployed();

    const discountedPrice = await sut.getDiscountedNodePrice.call();

    const tx = { from: accounts[5], value: discountedPrice };
    await sut.buyMasternodeReferral.sendTransaction(testAddress, accounts[4], tx);

    assert(await sut.checkReferralBonusHeight.call(accounts[1]) == web3.toWei(0.05, "ether"), "Invalid bonus height 1!");
    assert(await sut.checkReferralBonusHeight.call(accounts[2]) == web3.toWei(0.03, "ether"), "Invalid bonus height 2!");
    assert(await sut.checkReferralBonusHeight.call(accounts[3]) == web3.toWei(0.05, "ether"), "Invalid bonus height 3!");
    assert(await sut.checkReferralBonusHeight.call(accounts[4]) == web3.toWei(0.15, "ether"), "Invalid bonus height 4!");

    assert(await sut.getReferralBonusSum.call(accounts[1]) == web3.toWei(0.28, "ether"), "Invalid bonus sum 1!");
    assert(await sut.getReferralBonusSum.call(accounts[2]) == web3.toWei(0.23, "ether"), "Invalid bonus sum 2!");
    assert(await sut.getReferralBonusSum.call(accounts[3]) == web3.toWei(0.2, "ether"), "Invalid bonus sum 3!");
    assert(await sut.getReferralBonusSum.call(accounts[4]) == web3.toWei(0.15, "ether"), "Invalid bonus sum 4!");

    assert(await sut.currentDiscountSum.call() == web3.toWei(0.28, "ether"), "Invalid current discount sum!");
    assert(await sut.overallDiscountSum.call() == web3.toWei(0.86, "ether"), "Invalid overall discount sum!");
  });

  it("54 check bought nodes", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getNodesBoughtCountForAddress.call(accounts[1]) == 3, "Invalid node bought count 1!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[2]) == 1, "Invalid node bought count 2!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[3]) == 1, "Invalid node bought count 3!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[4]) == 1, "Invalid node bought count 4!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[5]) == 1, "Invalid node bought count 5!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[6]) == 0, "Invalid node bought count 6!");
  });

  it("55 check nr of referrals", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getNrOfReferrals.call(accounts[0]) == 0, "Invalid number of referrals 0!");
    assert(await sut.getNrOfReferrals.call(accounts[1]) == 1, "Invalid number of referrals 1!");
    assert(await sut.getNrOfReferrals.call(accounts[2]) == 1, "Invalid number of referrals 2!");
    assert(await sut.getNrOfReferrals.call(accounts[3]) == 1, "Invalid number of referrals 3!");
    assert(await sut.getNrOfReferrals.call(accounts[4]) == 1, "Invalid number of referrals 4!");
    assert(await sut.getNrOfReferrals.call(accounts[5]) == 0, "Invalid number of referrals 5!");
  });

  it("56 check referral children", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getReferralChild.call(accounts[1], 0) == accounts[2], "Invalid referrals 1!");
    assert(await sut.getReferralChild.call(accounts[2], 0) == accounts[3], "Invalid referrals 2!");
    assert(await sut.getReferralChild.call(accounts[3], 0) == accounts[4], "Invalid referrals 3!");
    assert(await sut.getReferralChild.call(accounts[4], 0) == accounts[5], "Invalid referrals 4!");
  });

  it("57 withdraw all referral bonuses", async () => {
    const sut = await Presale.deployed();

    let oldAmount = web3.eth.getBalance(accounts[1]).toNumber();
    let tx = { from: accounts[1] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    let newAmount = web3.eth.getBalance(accounts[1]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 1.');

    oldAmount = web3.eth.getBalance(accounts[2]).toNumber();
    tx = { from: accounts[2] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    newAmount = web3.eth.getBalance(accounts[2]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 2.');

    oldAmount = web3.eth.getBalance(accounts[3]).toNumber();
    tx = { from: accounts[3] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    newAmount = web3.eth.getBalance(accounts[3]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 3.');

    oldAmount = web3.eth.getBalance(accounts[4]).toNumber();
    tx = { from: accounts[4] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    newAmount = web3.eth.getBalance(accounts[4]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 4.');

    assert(await sut.checkReferralBonusHeight.call(accounts[1]) == web3.toWei(0, "ether"), "Invalid bonus height 1!");
    assert(await sut.checkReferralBonusHeight.call(accounts[2]) == web3.toWei(0, "ether"), "Invalid bonus height 2!");
    assert(await sut.checkReferralBonusHeight.call(accounts[3]) == web3.toWei(0, "ether"), "Invalid bonus height 3!");
    assert(await sut.checkReferralBonusHeight.call(accounts[4]) == web3.toWei(0, "ether"), "Invalid bonus height 4!");

    assert(await sut.getReferralBonusSum.call(accounts[1]) == web3.toWei(0.28, "ether"), "Invalid bonus sum 1!");
    assert(await sut.getReferralBonusSum.call(accounts[2]) == web3.toWei(0.23, "ether"), "Invalid bonus sum 2!");
    assert(await sut.getReferralBonusSum.call(accounts[3]) == web3.toWei(0.2, "ether"), "Invalid bonus sum 3!");
    assert(await sut.getReferralBonusSum.call(accounts[4]) == web3.toWei(0.15, "ether"), "Invalid bonus sum 4!");

    assert(await sut.currentDiscountSum.call() == web3.toWei(0, "ether"), "Invalid current discount sum!");
    assert(await sut.overallDiscountSum.call() == web3.toWei(0.86, "ether"), "Invalid overall discount sum!");
  });

  // level 1,2,3,4,5 (should not work)
  it("58 buying with valid referral (with commission on first, second, third and fourth level) and applied discount", async () => {
    const sut = await Presale.deployed();

    const discountedPrice = await sut.getDiscountedNodePrice.call();

    const tx = { from: accounts[6], value: discountedPrice };
    await sut.buyMasternodeReferral.sendTransaction(testAddress, accounts[5], tx);

    assert(await sut.checkReferralBonusHeight.call(accounts[1]) == web3.toWei(0.0, "ether"), "Invalid bonus height 1!");
    assert(await sut.checkReferralBonusHeight.call(accounts[2]) == web3.toWei(0.05, "ether"), "Invalid bonus height 2!");
    assert(await sut.checkReferralBonusHeight.call(accounts[3]) == web3.toWei(0.03, "ether"), "Invalid bonus height 3!");
    assert(await sut.checkReferralBonusHeight.call(accounts[4]) == web3.toWei(0.05, "ether"), "Invalid bonus height 4!");
    assert(await sut.checkReferralBonusHeight.call(accounts[5]) == web3.toWei(0.15, "ether"), "Invalid bonus height 5!");

    assert(await sut.getReferralBonusSum.call(accounts[1]) == web3.toWei(0.28, "ether"), "Invalid bonus sum 1!");
    assert(await sut.getReferralBonusSum.call(accounts[2]) == web3.toWei(0.28, "ether"), "Invalid bonus sum 2!");
    assert(await sut.getReferralBonusSum.call(accounts[3]) == web3.toWei(0.23, "ether"), "Invalid bonus sum 3!");
    assert(await sut.getReferralBonusSum.call(accounts[4]) == web3.toWei(0.2, "ether"), "Invalid bonus sum 4!");
    assert(await sut.getReferralBonusSum.call(accounts[5]) == web3.toWei(0.15, "ether"), "Invalid bonus sum 5!");

    assert(await sut.currentDiscountSum.call() == web3.toWei(0.28, "ether"), "Invalid current discount sum!");
    assert(await sut.overallDiscountSum.call() == web3.toWei(1.14, "ether"), "Invalid overall discount sum!");
  });

  it("59 check bought nodes", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getNodesBoughtCountForAddress.call(accounts[1]) == 3, "Invalid node bought count 1!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[2]) == 1, "Invalid node bought count 2!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[3]) == 1, "Invalid node bought count 3!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[4]) == 1, "Invalid node bought count 4!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[5]) == 1, "Invalid node bought count 5!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[6]) == 1, "Invalid node bought count 6!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[7]) == 0, "Invalid node bought count 7!");
  });

  it("60 check nr of referrals", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getNrOfReferrals.call(accounts[0]) == 0, "Invalid number of referrals 0!");
    assert(await sut.getNrOfReferrals.call(accounts[1]) == 1, "Invalid number of referrals 1!");
    assert(await sut.getNrOfReferrals.call(accounts[2]) == 1, "Invalid number of referrals 2!");
    assert(await sut.getNrOfReferrals.call(accounts[3]) == 1, "Invalid number of referrals 3!");
    assert(await sut.getNrOfReferrals.call(accounts[4]) == 1, "Invalid number of referrals 4!");
    assert(await sut.getNrOfReferrals.call(accounts[5]) == 1, "Invalid number of referrals 5!");
    assert(await sut.getNrOfReferrals.call(accounts[6]) == 0, "Invalid number of referrals 6!");
  });

  it("61 check referral children", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getReferralChild.call(accounts[1], 0) == accounts[2], "Invalid referrals 1!");
    assert(await sut.getReferralChild.call(accounts[2], 0) == accounts[3], "Invalid referrals 2!");
    assert(await sut.getReferralChild.call(accounts[3], 0) == accounts[4], "Invalid referrals 3!");
    assert(await sut.getReferralChild.call(accounts[4], 0) == accounts[5], "Invalid referrals 4!");
    assert(await sut.getReferralChild.call(accounts[5], 0) == accounts[6], "Invalid referrals 4!");
  });

  it("62 withdraw all referral bonuses", async () => {
    const sut = await Presale.deployed();

    let oldAmount = web3.eth.getBalance(accounts[1]).toNumber();
    let tx = { from: accounts[1] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    let newAmount = web3.eth.getBalance(accounts[1]).toNumber()
    assert(oldAmount >= newAmount, 'Referral bonus wrongly received 1.');

    oldAmount = web3.eth.getBalance(accounts[2]).toNumber();
    tx = { from: accounts[2] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    newAmount = web3.eth.getBalance(accounts[2]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 2.');

    oldAmount = web3.eth.getBalance(accounts[3]).toNumber();
    tx = { from: accounts[3] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    newAmount = web3.eth.getBalance(accounts[3]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 3.');

    oldAmount = web3.eth.getBalance(accounts[4]).toNumber();
    tx = { from: accounts[4] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    newAmount = web3.eth.getBalance(accounts[4]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 4.');

    oldAmount = web3.eth.getBalance(accounts[5]).toNumber();
    tx = { from: accounts[5] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    newAmount = web3.eth.getBalance(accounts[5]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 5.');

    assert(await sut.checkReferralBonusHeight.call(accounts[1]) == web3.toWei(0, "ether"), "Invalid bonus height 1!");
    assert(await sut.checkReferralBonusHeight.call(accounts[2]) == web3.toWei(0, "ether"), "Invalid bonus height 2!");
    assert(await sut.checkReferralBonusHeight.call(accounts[3]) == web3.toWei(0, "ether"), "Invalid bonus height 3!");
    assert(await sut.checkReferralBonusHeight.call(accounts[4]) == web3.toWei(0, "ether"), "Invalid bonus height 4!");
    assert(await sut.checkReferralBonusHeight.call(accounts[5]) == web3.toWei(0, "ether"), "Invalid bonus height 5!");

    assert(await sut.getReferralBonusSum.call(accounts[1]) == web3.toWei(0.28, "ether"), "Invalid bonus sum 1!");
    assert(await sut.getReferralBonusSum.call(accounts[2]) == web3.toWei(0.28, "ether"), "Invalid bonus sum 2!");
    assert(await sut.getReferralBonusSum.call(accounts[3]) == web3.toWei(0.23, "ether"), "Invalid bonus sum 3!");
    assert(await sut.getReferralBonusSum.call(accounts[4]) == web3.toWei(0.2, "ether"), "Invalid bonus sum 4!");
    assert(await sut.getReferralBonusSum.call(accounts[5]) == web3.toWei(0.15, "ether"), "Invalid bonus sum 5!");

    assert(await sut.currentDiscountSum.call() == web3.toWei(0, "ether"), "Invalid current discount sum!");
    assert(await sut.overallDiscountSum.call() == web3.toWei(1.14, "ether"), "Invalid overall discount sum!");
  });

  // level 1,2,3,4 - with multiple referrals
  it("63 buying with valid referral (with commission on first, second, third and fourth level) and applied discount", async () => {
    const sut = await Presale.deployed();

    const discountedPrice = await sut.getDiscountedNodePrice.call();

    const tx = { from: accounts[7], value: discountedPrice };
    await sut.buyMasternodeReferral.sendTransaction(testAddress, accounts[4], tx);

    assert(await sut.checkReferralBonusHeight.call(accounts[1]) == web3.toWei(0.05, "ether"), "Invalid bonus height 1!");
    assert(await sut.checkReferralBonusHeight.call(accounts[2]) == web3.toWei(0.03, "ether"), "Invalid bonus height 2!");
    assert(await sut.checkReferralBonusHeight.call(accounts[3]) == web3.toWei(0.05, "ether"), "Invalid bonus height 3!");
    assert(await sut.checkReferralBonusHeight.call(accounts[4]) == web3.toWei(0.15, "ether"), "Invalid bonus height 4!");

    assert(await sut.getReferralBonusSum.call(accounts[1]) == web3.toWei(0.33, "ether"), "Invalid bonus sum 1!");
    assert(await sut.getReferralBonusSum.call(accounts[2]) == web3.toWei(0.31, "ether"), "Invalid bonus sum 2!");
    assert(await sut.getReferralBonusSum.call(accounts[3]) == web3.toWei(0.28, "ether"), "Invalid bonus sum 3!");
    assert(await sut.getReferralBonusSum.call(accounts[4]) == web3.toWei(0.35, "ether"), "Invalid bonus sum 4!");
    assert(await sut.getReferralBonusSum.call(accounts[5]) == web3.toWei(0.15, "ether"), "Invalid bonus sum 5!");

    assert(await sut.currentDiscountSum.call() == web3.toWei(0.28, "ether"), "Invalid current discount sum!");
    assert(await sut.overallDiscountSum.call() == web3.toWei(1.42, "ether"), "Invalid overall discount sum!");
  });

  it("64 check bought nodes", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getNodesBoughtCountForAddress.call(accounts[1]) == 3, "Invalid node bought count 1!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[2]) == 1, "Invalid node bought count 2!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[3]) == 1, "Invalid node bought count 3!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[4]) == 1, "Invalid node bought count 4!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[5]) == 1, "Invalid node bought count 5!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[6]) == 1, "Invalid node bought count 6!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[7]) == 1, "Invalid node bought count 7!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[8]) == 0, "Invalid node bought count 8!");
  });

  it("65 check nr of referrals", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getNrOfReferrals.call(accounts[0]) == 0, "Invalid number of referrals 0!");
    assert(await sut.getNrOfReferrals.call(accounts[1]) == 1, "Invalid number of referrals 1!");
    assert(await sut.getNrOfReferrals.call(accounts[2]) == 1, "Invalid number of referrals 2!");
    assert(await sut.getNrOfReferrals.call(accounts[3]) == 1, "Invalid number of referrals 3!");
    assert(await sut.getNrOfReferrals.call(accounts[4]) == 2, "Invalid number of referrals 4!");
    assert(await sut.getNrOfReferrals.call(accounts[5]) == 1, "Invalid number of referrals 5!");
    assert(await sut.getNrOfReferrals.call(accounts[6]) == 0, "Invalid number of referrals 6!");
    assert(await sut.getNrOfReferrals.call(accounts[7]) == 0, "Invalid number of referrals 7!");
  });

  it("66 check referral children", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getReferralChild.call(accounts[1], 0) == accounts[2], "Invalid referrals 1!");
    assert(await sut.getReferralChild.call(accounts[2], 0) == accounts[3], "Invalid referrals 2!");
    assert(await sut.getReferralChild.call(accounts[3], 0) == accounts[4], "Invalid referrals 3!");
    assert(await sut.getReferralChild.call(accounts[4], 0) == accounts[5], "Invalid referrals 4!");
    assert(await sut.getReferralChild.call(accounts[5], 0) == accounts[6], "Invalid referrals 5!");
    assert(await sut.getReferralChild.call(accounts[4], 1) == accounts[7], "Invalid referrals 4.1!");
  });

  it("67 withdraw all referral bonuses", async () => {
    const sut = await Presale.deployed();

    let oldAmount = web3.eth.getBalance(accounts[1]).toNumber();
    let tx = { from: accounts[1] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    let newAmount = web3.eth.getBalance(accounts[1]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 1.');

    oldAmount = web3.eth.getBalance(accounts[2]).toNumber();
    tx = { from: accounts[2] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    newAmount = web3.eth.getBalance(accounts[2]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 2.');

    oldAmount = web3.eth.getBalance(accounts[3]).toNumber();
    tx = { from: accounts[3] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    newAmount = web3.eth.getBalance(accounts[3]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 3.');

    oldAmount = web3.eth.getBalance(accounts[4]).toNumber();
    tx = { from: accounts[4] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    newAmount = web3.eth.getBalance(accounts[4]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 4.');

    oldAmount = web3.eth.getBalance(accounts[5]).toNumber();
    tx = { from: accounts[5] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    newAmount = web3.eth.getBalance(accounts[5]).toNumber()
    assert(oldAmount >= newAmount, 'Referral bonus wrongly received 5.');

    assert(await sut.checkReferralBonusHeight.call(accounts[1]) == web3.toWei(0, "ether"), "Invalid bonus height 1!");
    assert(await sut.checkReferralBonusHeight.call(accounts[2]) == web3.toWei(0, "ether"), "Invalid bonus height 2!");
    assert(await sut.checkReferralBonusHeight.call(accounts[3]) == web3.toWei(0, "ether"), "Invalid bonus height 3!");
    assert(await sut.checkReferralBonusHeight.call(accounts[4]) == web3.toWei(0, "ether"), "Invalid bonus height 4!");
    assert(await sut.checkReferralBonusHeight.call(accounts[5]) == web3.toWei(0, "ether"), "Invalid bonus height 5!");

    assert(await sut.getReferralBonusSum.call(accounts[1]) == web3.toWei(0.33, "ether"), "Invalid bonus sum 1!");
    assert(await sut.getReferralBonusSum.call(accounts[2]) == web3.toWei(0.31, "ether"), "Invalid bonus sum 2!");
    assert(await sut.getReferralBonusSum.call(accounts[3]) == web3.toWei(0.28, "ether"), "Invalid bonus sum 3!");
    assert(await sut.getReferralBonusSum.call(accounts[4]) == web3.toWei(0.35, "ether"), "Invalid bonus sum 4!");
    assert(await sut.getReferralBonusSum.call(accounts[5]) == web3.toWei(0.15, "ether"), "Invalid bonus sum 5!");

    assert(await sut.currentDiscountSum.call() == web3.toWei(0, "ether"), "Invalid current discount sum!");
    assert(await sut.overallDiscountSum.call() == web3.toWei(1.42, "ether"), "Invalid overall discount sum!");
  });

  // level 1,2,3,4 - with multiple referrals
  it("68 buying with valid referral (with commission on first, second, third and fourth level) and applied discount", async () => {
    const sut = await Presale.deployed();

    const discountedPrice = await sut.getDiscountedNodePrice.call();

    const tx = { from: accounts[8], value: discountedPrice };
    await sut.buyMasternodeReferral.sendTransaction(testAddress, accounts[4], tx);

    assert(await sut.checkReferralBonusHeight.call(accounts[1]) == web3.toWei(0.05, "ether"), "Invalid bonus height 1!");
    assert(await sut.checkReferralBonusHeight.call(accounts[2]) == web3.toWei(0.03, "ether"), "Invalid bonus height 2!");
    assert(await sut.checkReferralBonusHeight.call(accounts[3]) == web3.toWei(0.05, "ether"), "Invalid bonus height 3!");
    assert(await sut.checkReferralBonusHeight.call(accounts[4]) == web3.toWei(0.15, "ether"), "Invalid bonus height 4!");

    assert(await sut.getReferralBonusSum.call(accounts[1]) == web3.toWei(0.38, "ether"), "Invalid bonus sum 1!");
    assert(await sut.getReferralBonusSum.call(accounts[2]) == web3.toWei(0.34, "ether"), "Invalid bonus sum 2!");
    assert(await sut.getReferralBonusSum.call(accounts[3]) == web3.toWei(0.33, "ether"), "Invalid bonus sum 3!");
    assert(await sut.getReferralBonusSum.call(accounts[4]) == web3.toWei(0.5, "ether"), "Invalid bonus sum 4!");
    assert(await sut.getReferralBonusSum.call(accounts[5]) == web3.toWei(0.15, "ether"), "Invalid bonus sum 5!");

    assert(await sut.currentDiscountSum.call() == web3.toWei(0.28, "ether"), "Invalid current discount sum!");
    assert(await sut.overallDiscountSum.call() == web3.toWei(1.7, "ether"), "Invalid overall discount sum!");
  });

  it("69 check bought nodes", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getNodesBoughtCountForAddress.call(accounts[1]) == 3, "Invalid node bought count 1!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[2]) == 1, "Invalid node bought count 2!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[3]) == 1, "Invalid node bought count 3!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[4]) == 1, "Invalid node bought count 4!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[5]) == 1, "Invalid node bought count 5!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[6]) == 1, "Invalid node bought count 6!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[7]) == 1, "Invalid node bought count 7!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[8]) == 1, "Invalid node bought count 8!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[9]) == 0, "Invalid node bought count 9!");
  });

  it("70 check nr of referrals", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getNrOfReferrals.call(accounts[0]) == 0, "Invalid number of referrals 0!");
    assert(await sut.getNrOfReferrals.call(accounts[1]) == 1, "Invalid number of referrals 1!");
    assert(await sut.getNrOfReferrals.call(accounts[2]) == 1, "Invalid number of referrals 2!");
    assert(await sut.getNrOfReferrals.call(accounts[3]) == 1, "Invalid number of referrals 3!");
    assert(await sut.getNrOfReferrals.call(accounts[4]) == 3, "Invalid number of referrals 4!");
    assert(await sut.getNrOfReferrals.call(accounts[5]) == 1, "Invalid number of referrals 5!");
    assert(await sut.getNrOfReferrals.call(accounts[6]) == 0, "Invalid number of referrals 6!");
    assert(await sut.getNrOfReferrals.call(accounts[7]) == 0, "Invalid number of referrals 7!");
    assert(await sut.getNrOfReferrals.call(accounts[8]) == 0, "Invalid number of referrals 8!");
  });

  it("71 check referral children", async () => {
    const sut = await Presale.deployed();

    assert(await sut.getReferralChild.call(accounts[1], 0) == accounts[2], "Invalid referrals 1!");
    assert(await sut.getReferralChild.call(accounts[2], 0) == accounts[3], "Invalid referrals 2!");
    assert(await sut.getReferralChild.call(accounts[3], 0) == accounts[4], "Invalid referrals 3!");
    assert(await sut.getReferralChild.call(accounts[4], 0) == accounts[5], "Invalid referrals 4!");
    assert(await sut.getReferralChild.call(accounts[5], 0) == accounts[6], "Invalid referrals 5!");
    assert(await sut.getReferralChild.call(accounts[4], 1) == accounts[7], "Invalid referrals 4.1!");
    assert(await sut.getReferralChild.call(accounts[4], 2) == accounts[8], "Invalid referrals 4.2!");
  });

  it("72 withdraw all referral bonuses", async () => {
    const sut = await Presale.deployed();

    let oldAmount = web3.eth.getBalance(accounts[1]).toNumber();
    let tx = { from: accounts[1] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    let newAmount = web3.eth.getBalance(accounts[1]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 1.');

    oldAmount = web3.eth.getBalance(accounts[2]).toNumber();
    tx = { from: accounts[2] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    newAmount = web3.eth.getBalance(accounts[2]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 2.');

    oldAmount = web3.eth.getBalance(accounts[3]).toNumber();
    tx = { from: accounts[3] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    newAmount = web3.eth.getBalance(accounts[3]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 3.');

    oldAmount = web3.eth.getBalance(accounts[4]).toNumber();
    tx = { from: accounts[4] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    newAmount = web3.eth.getBalance(accounts[4]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 4.');

    oldAmount = web3.eth.getBalance(accounts[5]).toNumber();
    tx = { from: accounts[5] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    newAmount = web3.eth.getBalance(accounts[5]).toNumber()
    assert(oldAmount >= newAmount, 'Referral bonus wrongly received 5.');

    assert(await sut.checkReferralBonusHeight.call(accounts[1]) == web3.toWei(0, "ether"), "Invalid bonus height 1!");
    assert(await sut.checkReferralBonusHeight.call(accounts[2]) == web3.toWei(0, "ether"), "Invalid bonus height 2!");
    assert(await sut.checkReferralBonusHeight.call(accounts[3]) == web3.toWei(0, "ether"), "Invalid bonus height 3!");
    assert(await sut.checkReferralBonusHeight.call(accounts[4]) == web3.toWei(0, "ether"), "Invalid bonus height 4!");
    assert(await sut.checkReferralBonusHeight.call(accounts[5]) == web3.toWei(0, "ether"), "Invalid bonus height 5!");

    assert(await sut.getReferralBonusSum.call(accounts[1]) == web3.toWei(0.38, "ether"), "Invalid bonus sum 1!");
    assert(await sut.getReferralBonusSum.call(accounts[2]) == web3.toWei(0.34, "ether"), "Invalid bonus sum 2!");
    assert(await sut.getReferralBonusSum.call(accounts[3]) == web3.toWei(0.33, "ether"), "Invalid bonus sum 3!");
    assert(await sut.getReferralBonusSum.call(accounts[4]) == web3.toWei(0.50, "ether"), "Invalid bonus sum 4!");
    assert(await sut.getReferralBonusSum.call(accounts[5]) == web3.toWei(0.15, "ether"), "Invalid bonus sum 5!");

    assert(await sut.currentDiscountSum.call() == web3.toWei(0, "ether"), "Invalid current discount sum!");
    assert(await sut.overallDiscountSum.call() == web3.toWei(1.7, "ether"), "Invalid overall discount sum!");
  });

  // other referral checks
  it("73 buying with invalid referral (own address)", async () => {
    const sut = await Presale.deployed();

    try {
      const discountedPrice = await sut.getDiscountedNodePrice.call();

      const tx = { from: accounts[3], value: discountedPrice };
      await sut.buyMasternodeReferral.sendTransaction(testAddress, accounts[3], tx);
      assert.fail();
    } catch (error) {
      assert(!error.toString().includes('assert.fail()'), "assert is not allowed to fail in try-part!");

      assert(await sut.currentDiscountSum.call() == web3.toWei(0, "ether"), "Invalid current discount sum!");
      assert(await sut.overallDiscountSum.call() == web3.toWei(1.7, "ether"), "Invalid overall discount sum!");
    }
  });

  it("74 buying with valid referral - referrals on parent have to stay the same", async () => {
    const sut = await Presale.deployed();

    const discountedPrice = await sut.getDiscountedNodePrice.call();

    const tx = { from: accounts[4], value: discountedPrice };
    await sut.buyMasternodeReferral.sendTransaction(testAddress, accounts[3], tx);

    // console.log("getNrOfReferrals", await sut.getNrOfReferrals.call(accounts[3]));
    // console.log("getNodesBoughtCountForAddress", await sut.getNodesBoughtCountForAddress.call(accounts[4]));
    // console.log("getReferralChild", await sut.getReferralChildren.call(accounts[3]));

    assert(await sut.getNrOfReferrals.call(accounts[3]) == 1, "Invalid number of referrals 3!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[4]) == 2, "Invalid node bought count 4!");
    assert((await sut.getReferralChildren.call(accounts[3])).length == 1, "Invalid referrals 3!");
  });

  it("75 buying with valid referral (new referral address as the last time) - referrals on parent have to stay the same", async () => {
    const sut = await Presale.deployed();

    const discountedPrice = await sut.getDiscountedNodePrice.call();

    const tx = { from: accounts[4], value: discountedPrice };
    await sut.buyMasternodeReferral.sendTransaction(testAddress, accounts[1], tx);

    // console.log("getNrOfReferrals", await sut.getNrOfReferrals.call(accounts[1]));
    // console.log("getNodesBoughtCountForAddress", await sut.getNodesBoughtCountForAddress.call(accounts[4]));
    // console.log("getReferralChild", await sut.getReferralChildren.call(accounts[1]));

    assert(await sut.getNrOfReferrals.call(accounts[1]) == 1, "Invalid number of referrals 1!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[4]) == 3, "Invalid node bought count 4!");
    assert((await sut.getReferralChildren.call(accounts[1])).length == 1, "Invalid referrals 1!");
  });

  it("76 withdraw all referral bonuses", async () => {
    const sut = await Presale.deployed();

    let oldAmount = web3.eth.getBalance(accounts[1]).toNumber();
    let tx = { from: accounts[1] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    let newAmount = web3.eth.getBalance(accounts[1]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 1.');

    oldAmount = web3.eth.getBalance(accounts[2]).toNumber();
    tx = { from: accounts[2] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    newAmount = web3.eth.getBalance(accounts[2]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 2.');

    oldAmount = web3.eth.getBalance(accounts[3]).toNumber();
    tx = { from: accounts[3] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    newAmount = web3.eth.getBalance(accounts[3]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus not received 3.');

    assert(await sut.currentDiscountSum.call() == web3.toWei(0, "ether"), "Invalid current discount sum!");
    assert(await sut.overallDiscountSum.call() == web3.toWei(2.08, "ether"), "Invalid overall discount sum!");
  });


  it("77 check for valid referral address", async () => {
    const sut = await Presale.deployed();

    assert(await sut.isValidReferralAddress.call(accounts[9]) == false, "Invalid referral address state!");

    const tx = { from: accounts[0] };
    await sut.addReferralAddress.sendTransaction(accounts[9], tx);

    assert(await sut.isValidReferralAddress.call(accounts[9]) == true, "Invalid referral address state!");
  });

  it("78 buying with valid referral (newly added referral address)", async () => {
    const sut = await Presale.deployed();

    const discountedPrice = await sut.getDiscountedNodePrice.call();

    const tx = { from: accounts[10], value: discountedPrice };
    await sut.buyMasternodeReferral.sendTransaction(testAddress, accounts[9], tx);

    // console.log("getNrOfReferrals", await sut.getNrOfReferrals.call(accounts[1]));
    // console.log("getNodesBoughtCountForAddress", await sut.getNodesBoughtCountForAddress.call(accounts[4]));
    // console.log("getReferralChild", await sut.getReferralChildren.call(accounts[1]));

    assert(await sut.getNrOfReferrals.call(accounts[9]) == 1, "Invalid number of referrals 9!");
    assert(await sut.getNodesBoughtCountForAddress.call(accounts[10]) == 1, "Invalid node bought count 10!");
    assert((await sut.getReferralChildren.call(accounts[9])).length == 1, "Invalid referrals 9!");
  });

  it("79 check for valid referral address", async () => {
    const sut = await Presale.deployed();

    assert(await sut.isValidReferralAddress.call(accounts[9]) == true, "Invalid referral address state!");

    const tx = { from: accounts[0] };
    await sut.removeReferralAddress.sendTransaction(accounts[9], tx);

    assert(await sut.isValidReferralAddress.call(accounts[9]) == false, "Invalid referral address state!");
  });

  it("80 withdraw referral bonus for manually inserted address", async () => {
    const sut = await Presale.deployed();

    const oldAmount = web3.eth.getBalance(accounts[9]).toNumber();
    tx = { from: accounts[9] };
    await sut.withdrawReferralBonus.sendTransaction(tx);
    const newAmount = web3.eth.getBalance(accounts[9]).toNumber()
    assert(oldAmount < newAmount, 'Referral bonus wrongly received 9.');

    assert(await sut.checkReferralBonusHeight.call(accounts[9]) == web3.toWei(0, "ether"), "Invalid bonus height 9!");
    assert(await sut.getReferralBonusSum.call(accounts[9]) == web3.toWei(0.15, "ether"), "Invalid bonus sum 9!");

    assert(await sut.currentDiscountSum.call() == web3.toWei(0, "ether"), "Invalid current discount sum!");
    assert(await sut.overallDiscountSum.call() == web3.toWei(2.23, "ether"), "Invalid overall discount sum!");
  });
})
