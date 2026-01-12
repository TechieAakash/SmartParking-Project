const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/balance', authenticate, walletController.getBalance);
router.post('/topup', authenticate, walletController.topUp);
router.get('/transactions', authenticate, walletController.getTransactions);

module.exports = router;
