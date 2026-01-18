const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WalletTransaction = sequelize.define('WalletTransaction', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'user_id'
  },
  walletId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'wallet_id'
  },
  transactionType: {
    type: DataTypes.ENUM('credit', 'debit', 'refund'),
    allowNull: false,
    field: 'transaction_type'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  balanceAfter: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'balance_after'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  referenceId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'reference_id'
  }
}, {
  timestamps: true,
  tableName: 'wallet_transactions',
  underscored: true
});

module.exports = WalletTransaction;
