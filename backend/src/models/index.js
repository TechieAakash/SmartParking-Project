/**
 * Models Index - Simplified for UI alignment
 * Only includes: User, ParkingZone, Violation, Setting, AuditLog
 */

const { sequelize } = require('../config/database');

// Import only required models
const User = require('./User');
const ParkingZone = require('./ParkingZone');
const Violation = require('./Violation');
const Setting = require('./Setting');
const AuditLog = require('./AuditLog');
const ChatSession = require('./ChatSession');
const ChatMessage = require('./ChatMessage');
const Vehicle = require('./Vehicle');
const Booking = require('./Booking');
const Wallet = require('./Wallet');
const WalletTransaction = require('./WalletTransaction');
const Subscription = require('./Subscription');
const ParkingSlot = require('./ParkingSlot');
const ValidOfficerBadge = require('./ValidOfficerBadge');

// Define associations

// User ← → Wallet
User.hasOne(Wallet, { foreignKey: 'userId', as: 'wallet' });
Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User ← → WalletTransaction
User.hasMany(WalletTransaction, { foreignKey: 'userId', as: 'transactions' });
WalletTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User ← → Subscription
User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ParkingZone ← → Subscription
ParkingZone.hasMany(Subscription, { foreignKey: 'zoneId', as: 'subscriptions' });
Subscription.belongsTo(ParkingZone, { foreignKey: 'zoneId', as: 'zone' });

// User ← → Vehicle
User.hasMany(Vehicle, { foreignKey: 'userId', as: 'vehicles' });
Vehicle.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

// User ← → Booking
User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ParkingZone ← → Booking
ParkingZone.hasMany(Booking, { foreignKey: 'zoneId', as: 'bookings' });
Booking.belongsTo(ParkingZone, { foreignKey: 'zoneId', as: 'zone' });

// Vehicle ← → Booking
Vehicle.hasMany(Booking, { foreignKey: 'vehicleId', as: 'bookings' });
Booking.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

// User ← → Violation
User.hasMany(Violation, { foreignKey: 'resolved_by', as: 'resolvedViolations'});
Violation.belongsTo(User, { foreignKey: 'resolved_by', as: 'resolver' });

// ParkingZone ← → Violation
ParkingZone.hasMany(Violation, { foreignKey: 'zone_id', as: 'violations' });
Violation.belongsTo(ParkingZone, { foreignKey: 'zone_id', as: 'zone' });

// ParkingZone ← → ParkingSlot
ParkingZone.hasMany(ParkingSlot, { foreignKey: 'zone_id', as: 'slots' });
ParkingSlot.belongsTo(ParkingZone, { foreignKey: 'zone_id', as: 'zone' });

// User ← → ChatSession
User.hasMany(ChatSession, { foreignKey: 'user_id', as: 'chatSessions' });
ChatSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ChatSession ← → ChatMessage
ChatSession.hasMany(ChatMessage, { foreignKey: 'session_id', as: 'messages' });
ChatMessage.belongsTo(ChatSession, { foreignKey: 'session_id', as: 'session' });

// User ← → ChatMessage
User.hasMany(ChatMessage, { foreignKey: 'user_id', as: 'chatMessages' });
ChatMessage.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Export all models
module.exports = {
  sequelize,
  User,
  ParkingZone,
  Violation,
  Setting,
  AuditLog,
  ChatSession,
  ChatMessage,
  Vehicle,
  Booking,
  Wallet,
  Subscription,
  ParkingSlot,
  ValidOfficerBadge
};
