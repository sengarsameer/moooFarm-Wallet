const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const Wallet = require('../models/wallet');
const router = new express.Router();

router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
    } catch (e) {
        res.status(400).send(e);
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        })
        await req.user.save();

        res.send();
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/users/profile', auth, async (req, res) => {
    try {
        const {deposit, wining, bonus} = await Wallet.findOne({ owner: req.user._id });
        const wallet = {
            "Total Balance": deposit + wining + bonus
        }
        res.send({"profile": req.user, "wallet": wallet});
    } catch (e) {
        res.status(500).send()
    }
    
})

router.delete('/users/profile', auth, async (req, res) => {
    try {
        await req.user.remove()
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router