const express = require('express');
require('./db/mongoose');
const userRouter = require('./routers/user');
const walletRouter = require('./routers/wallet');

const app = express();

app.use(express.json());
app.use(userRouter);
app.use(walletRouter);

module.exports = app;