const { Booking, ParkingZone, ParkingSlot, Vehicle, Wallet, sequelize } = require('../models');
const { successResponse } = require('../utils/response');
const { ValidationError, NotFoundError, InsufficientFundsError } = require('../utils/CustomError');
const { Op } = require('sequelize');

const createBooking = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { zoneId, vehicleId, startTime, endTime, totalPrice } = req.body;
    const userId = req.user.id;

    console.log('Creating booking with payload:', { zoneId, vehicleId, startTime, endTime, totalPrice, userId });

    // Validate Vehicle
    console.log('Step 1: Validating Vehicle...');
    const vehicle = await Vehicle.findOne({ where: { id: vehicleId, userId } });
    if (!vehicle) {
        console.error('Vehicle validation failed: Vehicle not found or not owned by user');
        throw new ValidationError('Invalid vehicle selected');
    }
    console.log('Vehicle found:', vehicle.id);

    // Find or create a slot for this zone
    console.log('Step 2: Finding Slot...');
    let slot = await ParkingSlot.findOne({ where: { zoneId } });
    
    if (!slot) {
      console.log('No slot found, creating new one for zone:', zoneId);
      // Create a default slot for this zone if none exists
      slot = await ParkingSlot.create({
        zoneId: zoneId,
        slotNumber: 'A1',
        slotType: 'car',
        status: 'available'
      }, { transaction });
      console.log('New slot created:', slot.id);
    } else {
        console.log('Existing slot found:', slot.id);
    }

    // Handle Payment (Wallet) - if totalPrice provided
    if (totalPrice && parseFloat(totalPrice) > 0) {
      console.log('Step 3: Processing Wallet Payment of:', totalPrice);
      const wallet = await Wallet.findOne({ where: { userId } });
      if (!wallet) {
          console.error('Wallet not found for user:', userId);
          throw new NotFoundError('Wallet not found');
      }
      console.log('Wallet found, balance:', wallet.balance);
      
      if (parseFloat(wallet.balance) < parseFloat(totalPrice)) {
        console.error('Insufficient funds. Required:', totalPrice, 'Available:', wallet.balance);
        throw new InsufficientFundsError('Insufficient wallet balance. Please top up.');
      }
      await wallet.update({ balance: parseFloat(wallet.balance) - parseFloat(totalPrice) }, { transaction });
      console.log('Wallet deducted successfully');
    }

    // Create Booking using database schema field names
    console.log('Step 4: Creating Booking record...');
    const booking = await Booking.create({
      userId,
      zoneId,
      slotId: slot.id,
      vehicleId,
      bookingStart: startTime,
      bookingEnd: endTime,
      bookingType: 'hourly',
      status: 'active',
      totalPrice: totalPrice || 0
    }, { transaction });
    console.log('Booking created successfully:', booking.id);

    await transaction.commit();
    
    successResponse(res, { 
      booking: {
        id: booking.id,
        bookingCode: `BK-${booking.id}`,
        status: booking.status
      } 
    }, 'Booking confirmed successfully');
  } catch (error) {
    console.error('Booking error:', error);
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Vehicle, as: 'vehicle', attributes: ['licensePlate', 'model'] }
      ],
      order: [['id', 'DESC']]
    });
    successResponse(res, { bookings });
  } catch (error) {
    next(error);
  }
};

const checkAvailability = async (req, res, next) => {
  try {
    const { zoneId, startTime, endTime } = req.query;
    
    const zone = await ParkingZone.findByPk(zoneId);
    if (!zone) throw new NotFoundError('Zone not found');

    // Just return zone info - simplified availability check
    successResponse(res, { 
      availableSlots: zone.totalCapacity || 50, 
      isAvailable: true,
      zoneName: zone.name,
      hourlyRate: zone.hourlyRate || 50
    });
  } catch (error) {
    next(error);
  }
};

const { Subscription } = require('../models');

const purchaseSubscription = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { planType, zoneId, price } = req.body;
    const userId = req.user.id;

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    if (planType === 'weekly') endDate.setDate(endDate.getDate() + 7);
    else if (planType === 'monthly') endDate.setDate(endDate.getDate() + 30);
    else throw new ValidationError('Invalid plan type');

    // Handle Payment (Wallet)
    const wallet = await Wallet.findOne({ where: { userId } });
    if (!wallet || parseFloat(wallet.balance) < parseFloat(price)) {
      throw new InsufficientFundsError('Insufficient wallet balance. Please top up.');
    }
    
    // Deduct from wallet
    await wallet.update({ balance: parseFloat(wallet.balance) - parseFloat(price) }, { transaction });

    // Create Subscription
    const subscription = await Subscription.create({
      userId,
      passType: planType, // Mapped to passType
      zoneId: zoneId || null,
      startDate,
      endDate,
      price,
      status: 'active',
      qrCode: `MCD-SUB-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    }, { transaction });

    await transaction.commit();
    successResponse(res, { subscription }, 'Subscription purchased successfully');
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const getMySubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.findAll({
      where: { userId: req.user.id },
      include: [{ model: ParkingZone, as: 'zone', attributes: ['name'] }],
      order: [['id', 'DESC']]
    });
    successResponse(res, { subscriptions });
  } catch (error) {
    next(error);
  }
};

const scanBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findOne({ where: { id, userId: req.user.id } });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status === 'cancelled' || booking.status === 'expired') {
        throw new ValidationError('Booking is not valid for scanning');
    }

    // Update status and entry time
    await booking.update({
        status: 'active',
        entryTime: new Date()
    });

    successResponse(res, { 
        booking,
        entryTime: booking.entryTime 
    }, 'Booking scanned successfully');
  } catch (error) {
    next(error);
  }
};

// ... (previous code)

const scanSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findOne({ where: { id, userId: req.user.id } });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    if (subscription.status !== 'active') {
        throw new ValidationError('Subscription is not active');
    }

    const today = new Date();
    const endDate = new Date(subscription.endDate);
    if (today > endDate) {
         subscription.status = 'expired';
         await subscription.save();
         throw new ValidationError('Subscription has expired');
    }

    // Since subscription is unlimited access, we just log the scan or return success
    // We can verify if user is already "in" or "out" if we tracked entry state for subs
    // But for now, valid subscription = Open Gate.

    successResponse(res, { 
        subscription,
        validity: 'Valid'
    }, 'Subscription scanned successfully. Access Granted.');
  } catch (error) {
    next(error);
  }
};

// ... (previous code)

const cancelSubscription = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const subscription = await Subscription.findOne({ where: { id, userId: req.user.id } });

    if (!subscription) {
        throw new NotFoundError('Subscription not found');
    }

    if (subscription.status !== 'active') {
        throw new ValidationError('Subscription is not active');
    }

    // Check 5-day cancellation policy
    const startDate = new Date(subscription.startDate);
    const now = new Date();
    const diffTime = Math.abs(now - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays > 5) {
        throw new ValidationError('Cancellation period (5 days) has expired.');
    }

    const price = parseFloat(subscription.price);
    const refundAmount = price / 6; // Exactly 1/6th as per request

    // Refund to wallet
    const wallet = await Wallet.findOne({ where: { userId: req.user.id }, transaction });
    if (wallet) {
        await wallet.update({ balance: parseFloat(wallet.balance) + refundAmount }, { transaction });
    }

    // Update Subscription
    await subscription.update({ status: 'cancelled' }, { transaction });

    // Log Transaction
    const { WalletTransaction } = require('../models');
    await WalletTransaction.create({
        walletId: wallet.id,
        userId: req.user.id,
        amount: refundAmount,
        transactionType: 'refund',
        balanceAfter: parseFloat(wallet.balance),
        description: `1/6 Refund for Subscription #${subscription.id}`,
        status: 'completed'
    }, { transaction });

    await transaction.commit();

    successResponse(res, { 
        subscription,
        refundAmount,
        message: `Subscription cancelled. ₹${refundAmount.toFixed(2)} refunded to wallet.`
    });

  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const booking = await Booking.findOne({ where: { id, userId: req.user.id } });
  
      if (!booking) {
          throw new NotFoundError('Booking not found');
      }
  
      if (booking.status !== 'active') {
          throw new ValidationError('Booking is not active');
      }
  
      // Check 5-day cancellation policy (based on bookingStart)
      const startDate = new Date(booking.bookingStart);
      const now = new Date();
      const diffTime = Math.abs(now - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays > 5) {
          throw new ValidationError('Cancellation period (5 days) has expired.');
      }
  
      const price = parseFloat(booking.totalPrice);
      const refundAmount = price / 6; 
  
      // Refund to wallet
      const wallet = await Wallet.findOne({ where: { userId: req.user.id }, transaction });
      if (wallet) {
          await wallet.update({ balance: parseFloat(wallet.balance) + refundAmount }, { transaction });
      }
  
      // Update Status
      await booking.update({ status: 'cancelled' }, { transaction });
  
      // Log Transaction
      const { WalletTransaction } = require('../models');
      await WalletTransaction.create({
          walletId: wallet.id,
          userId: req.user.id,
          amount: refundAmount,
          transactionType: 'refund',
          balanceAfter: parseFloat(wallet.balance),
          description: `1/6 Refund for Booking #${booking.id}`,
          status: 'completed'
      }, { transaction });
  
      await transaction.commit();
  
      successResponse(res, { 
          booking,
          refundAmount,
          message: `Booking cancelled. ₹${refundAmount.toFixed(2)} refunded to wallet.`
      });
  
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
};

module.exports = {
  createBooking,
  getMyBookings,
  checkAvailability,
  purchaseSubscription,
  getMySubscriptions,
  scanBooking,
  scanSubscription,
  cancelSubscription,
  cancelBooking
};
