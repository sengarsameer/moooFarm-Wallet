const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user');
const Wallet = require('../src/models/wallet');

const userTestId = new mongoose.Types.ObjectId();
const walletTestId = new mongoose.Types.ObjectId();

const userTest = {
    _id: userTestId,
    name: 'mf0',
    email: 'mf0@mail.com',
    password: 'Qwerty@123',
    tokens: [{
        token: jwt.sign({_id: userTestId}, process.env.JWT_SECRET)
    }]
}

const walletTest = {
    _id: walletTestId,
    deposit: 200,
    wining: 300,
    bonus: 100,
    owner: userTestId
}

beforeEach( async() => {
    await User.deleteMany();
    await Wallet.deleteMany();
    await new User(userTest).save();
    await new Wallet(walletTest).save();
})

test('user signup', async() => {
    await request(app).post('/users').send({
        name: 'mf1',
        email: 'mf1@mail.com',
        password: 'Qwerty@123'
    }).expect(201)
})

test('user login', async() => {
    await request(app).post('/users/login').send({
        email: userTest.email,
        password: userTest.password
    }).expect(200)
})

test('new user login failed', async() => {
    await request(app).post('/users/login').send({
        email: 'new@mail.com',
        password: 'error'
    }).expect(400)
})

test('user profile', async() => {
    await request(app).get('/users/profile').set('Authorization', `Bearer ${userTest.tokens[0].token}`).send().expect(200)
})

test('wallet update only deposit', async() => {
    await request(app).patch(`/wallet/${walletTestId}/update`).set('Authorization', `Bearer ${userTest.tokens[0].token}`).send({
        deposit: 100
    }).expect(201)
})

test('wallet update only deposit invalid param failed', async() => {
    await request(app).patch(`/wallet/${walletTestId}/update`).set('Authorization', `Bearer ${userTest.tokens[0].token}`).send({
        deposit: 100,
        bonus: 50
    }).expect(400)
})

test('wallet service fee', async() => {
    await request(app).patch(`/wallet/${walletTestId}/servicefee`).set('Authorization', `Bearer ${userTest.tokens[0].token}`).send({
        entryfee: 400,
        discount: 20
    }).expect(201)
})

test('wallet service failed insufficient amount', async() => {
    await request(app).patch(`/wallet/${walletTestId}/servicefee`).set('Authorization', `Bearer ${userTest.tokens[0].token}`).send({
        entryfee: 800,
        discount: 10
    }).expect(404)
})

test('wallet service failed wallet not found', async() => {
    await request(app).patch(`/wallet/${userTestId}/servicefee`).set('Authorization', `Bearer ${userTest.tokens[0].token}`).send({
        entryfee: 400,
        discount: 20
    }).expect(404)
})

test('wallet service failed invalid entryfee or discount', async() => {
    await request(app).patch(`/wallet/${walletTestId}/servicefee`).set('Authorization', `Bearer ${userTest.tokens[0].token}`).send({
        entryfee: 0,
        discount: 10
    }).expect(400)
})