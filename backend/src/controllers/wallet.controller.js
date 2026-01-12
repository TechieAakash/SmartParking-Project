const { Wallet, WalletTransaction } = require('../models');
const { successResponse } = require('../utils/response');
const { NotFoundError } = require('../utils/CustomError');

const getBalance = async (req, res, next) => {
  try {
    let wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user.id, balance: 0 });
    }
    successResponse(res, { balance: wallet.balance, currency: wallet.currency });
  } catch (error) {
    next(error);
  }
};

const topUp = async (req, res, next) => {
  try {
    const { amount } = req.body;
    let wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user.id, balance: 0 });
    }
    
    // Update Balance
    await wallet.update({ balance: parseFloat(wallet.balance) + parseFloat(amount) });
    
    // Create Transaction Record
    await WalletTransaction.create({
      userId: req.user.id,
      amount: parseFloat(amount),
      type: 'CREDIT',
      description: 'Wallet Top Up via Online Payment',
      status: 'SUCCESS',
      referenceId: 'TXN' + Date.now()
    });

    successResponse(res, { balance: wallet.balance }, 'Wallet topped up successfully');
  } catch (error) {
    next(error);
  }
};

const getTransactions = async (req, res, next) => {
    try {
        const transactions = await WalletTransaction.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 20
        });
        successResponse(res, { transactions });
    } catch (error) {
        next(error);
    }
};

module.exports = {
  getBalance,
  topUp,
  getTransactions
};
