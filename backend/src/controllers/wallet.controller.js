const { Wallet, WalletTransaction } = require('../models');
const { successResponse } = require('../utils/response');
const { NotFoundError } = require('../utils/CustomError');

const getBalance = async (req, res, next) => {
  try {
    let wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user.id, balance: 0 });
    }
    successResponse(res, { balance: parseFloat(wallet.balance) });
  } catch (error) {
    next(error);
  }
};

const topUp = async (req, res, next) => {
  try {
    const { amount } = req.body;
    
    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    let wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user.id, balance: 0 });
    }
    
    // Calculate new balance
    const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
    
    // Update Balance
    await wallet.update({ balance: newBalance });
    
    // Reload to get updated balance
    await wallet.reload();
    
    // Create Transaction Record
    await WalletTransaction.create({
      userId: req.user.id,
      walletId: wallet.id,
      transactionType: 'credit',
      amount: parseFloat(amount),
      balanceAfter: parseFloat(wallet.balance),
      description: 'Wallet Top Up via Online Payment',
      referenceId: 'TXN' + Date.now()
    });

    successResponse(res, { balance: parseFloat(wallet.balance) }, 'Wallet topped up successfully');
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
