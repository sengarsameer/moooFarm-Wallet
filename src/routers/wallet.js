const express = require('express');
const Wallet = require('../models/wallet');
const auth = require('../middleware/auth');
const router = new express.Router();

/**
 * @description Create a user's peronal wallet
 */
router.post('/wallet', auth, async (req, res) => {
    const fields = Object.keys(req.body);
    const buckets = ['deposit', 'wining', 'bonus']
    const isValidOperation = fields.every((field) => buckets.includes(field));
    if(!isValidOperation) {
        return res.status(400).send({error: 'Invalid wallet bucket'});
    }

    const wallet = new Wallet({
        ...req.body,
        owner: req.user._id
    })

    try {
        await wallet.save()
        res.status(201).send(wallet)
    } catch (e) {
        res.status(400).send(e)
    }
})

/**
 * @description wallet bucket uppdate - only providing for deposit bucket
 * @param {
 *  deposit: Number
 * }
 */
router.patch('/wallet/:id/update', auth, async (req, res) => {

    const updates = Object.keys(req.body);
    const allowedUpdates = ['deposit'] // add bonus and wining for updates
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    // param validation
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid field!' })
    }
    try {
        // wallet validation
        const wallet = await Wallet.findOne({
            _id: req.params.id,
            owner: req.user._id
        })
        if(!wallet) {
            return res.status(404).send()
        }

        const walletDeposit = wallet.deposit;
        req.body.deposit = walletDeposit + req.body.deposit // add amount
        updates.forEach((update) => wallet[update] = req.body[update]); // update deposit wallet bucket
        await wallet.save(); // save wallet
        res.status(201).send(wallet)
    } catch (e) {
        res.status(400).send(e)
    }
})

/**
 * @description service entry fee submission and wallet update
 * @param {
 *  entryfee: Number
 *  discount: Number
 * }
 */
router.patch('/wallet/:id/servicefee', auth, async (req, res) => {

    const fields = Object.keys(req.body);
    const feeAndDiscount = ['entryfee', 'discount']
    const isfeeAndDiscount = fields.every((field) => feeAndDiscount.includes(field));
    const entryFee = req.body.entryfee;
    let newWallet = {};

    // param validation
    if(!isfeeAndDiscount || entryFee < 1) {
        return res.status(400).send({error: 'Invalid amount or discount field'});
    }

    // check discount value    
    let discountPer = req.body.discount;
    if(discountPer == 0 || discountPer == undefined) {
        discountPer = null;
    }

    // business logic
    try {
        // validate wallet
        const wallet = await Wallet.findOne({
            _id: req.params.id,
            owner: req.user._id
        })
        if(!wallet) {
            return res.status(404).send();
        }

        const walletBonus = wallet.bonus;
        const walletDeposit = wallet.deposit;
        const walletWining = wallet.wining;

        // discount x% on original entry fee
        const discount = (entryFee * discountPer) / 100;
        // discounted entry fee
        const discountedEntry = entryFee - discount;
        // 10% of entry fee from bucket
        const bonus10Per = (discountedEntry*10) / 100;

        // check bonus %
        let newBonus = bonus10Per;
        if(walletBonus < bonus10Per) {
            newBonus = walletBonus;
        }

        let bonusDeposit = walletDeposit + newBonus;
        let bonusDepositWining = walletDeposit + walletWining + newBonus;

        // check sufficient amount and have to use wining bucket or not
        if(bonusDeposit >= discountedEntry){ // without wining bucket
            newWallet.bonus = walletBonus - newBonus;
            newWallet.deposit = walletDeposit - (discountedEntry - newBonus);
            const updates = Object.keys(newWallet);
            updates.forEach((update) => wallet[update] = newWallet[update]); // update wallet bucket
            await wallet.save(); // save new wallet bucket amount
            res.status(201).send({wallet, Msg: "sufficient Amount without Wining bucket"});
        }
        else if(bonusDepositWining >= discountedEntry) { // with wining bucket
            newWallet.bonus = walletBonus - newBonus;
            newWallet.wining = walletWining - (discountedEntry - (newBonus + walletDeposit));
            newWallet.deposit = 0;
            const updates = Object.keys(newWallet);
            updates.forEach((update) => wallet[update] = newWallet[update]); // update wallet bucket
            await wallet.save(); // save new wallet bucket amount
            res.status(201).send({wallet, Msg: "sufficient Amount with Wining bucket"});
        }
        else {
            res.status(404).send({wallet, Msg: "Insufficient Amount"});
        }
        
    } catch (e) {
        res.status(400).send(e)
    }
})

module.exports = router;