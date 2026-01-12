const { Booking, ParkingZone, Vehicle, Wallet, sequelize } = require('../models');
const { successResponse } = require('../utils/response');
const { ValidationError, NotFoundError, InsufficientFundsError } = require('../utils/CustomError');
const { Op } = require('sequelize');

const createBooking = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { zoneId, vehicleId, startTime, endTime, totalPrice } = req.body;
    const userId = req.user.id;

    // 1. Validate Zone
    const zone = await ParkingZone.findByPk(zoneId);
    if (!zone) throw new NotFoundError('Parking zone not found');

    // 2. Validate Vehicle
    const vehicle = await Vehicle.findOne({ where: { id: vehicleId, userId } });
    if (!vehicle) throw new ValidationError('Invalid vehicle selected');

    // 3. Check Availability (Simplified: check overlapping bookings in same zone)
    const overlappingBookings = await Booking.count({
      where: {
        zoneId,
        status: 'active',
        [Op.or]: [
          {
            startTime: { [Op.between]: [startTime, endTime] }
          },
          {
            endTime: { [Op.between]: [startTime, endTime] }
          }
        ]
      }
    }, { transaction });

    if (overlappingBookings >= zone.capacity) {
      throw new ValidationError('No slots available for the selected time period');
    }

    // 4. Handle Payment (Wallet)
    const wallet = await Wallet.findOne({ where: { userId } }, { transaction });
    if (!wallet || wallet.balance < totalPrice) {
      throw new InsufficientFundsError('Insufficient wallet balance. Please top up.');
    }

    // Deduct from wallet
    await wallet.update({ balance: wallet.balance - totalPrice }, { transaction });

    // 5. Create Booking
    const bookingCode = 'BK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const duration = Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60));

    const booking = await Booking.create({
      bookingCode,
      userId,
      zoneId,
      vehicleId,
      startTime,
      endTime,
      duration,
      totalPrice,
      status: 'active',
      paymentStatus: 'paid',
      qrCode: `MCD-QR-${bookingCode}` // Mock QR
    }, { transaction });

    await transaction.commit();
    successResponse(res, { booking }, 'Booking confirmed successfully');
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.findAll({
      where: { userId: req.user.id },
      include: [
        { model: ParkingZone, as: 'zone', attributes: ['name', 'address'] },
        { model: Vehicle, as: 'vehicle', attributes: ['licensePlate', 'model'] }
      ],
      order: [['created_at', 'DESC']]
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

    const bookingsCount = await Booking.count({
      where: {
        zoneId,
        status: 'active',
        [Op.or]: [
          { startTime: { [Op.between]: [startTime, endTime] } },
          { endTime: { [Op.between]: [startTime, endTime] } }
        ]
      }
    });

    const availableSlots = Math.max(0, zone.capacity - bookingsCount);
    successResponse(res, { 
      availableSlots, 
      isAvailable: availableSlots > 0,
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

    // 1. Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    if (planType === 'weekly') endDate.setDate(endDate.getDate() + 7);
    else if (planType === 'monthly') endDate.setDate(endDate.getDate() + 30);
    else throw new ValidationError('Invalid plan type');

    // 2. Handle Payment (Wallet)
    const wallet = await Wallet.findOne({ where: { userId } }, { transaction });
    if (!wallet || wallet.balance < price) {
      throw new InsufficientFundsError('Insufficient wallet balance. Please top up.');
    }
    
    // Deduct from wallet
    await wallet.update({ balance: wallet.balance - price }, { transaction });

    // 3. Create Subscription
    const subscription = await Subscription.create({
      userId,
      planType,
      zoneId: zoneId || null, // null means all zones
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
      order: [['created_at', 'DESC']]
    });
    successResponse(res, { subscriptions });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  checkAvailability,
  purchaseSubscription,
  getMySubscriptions
};
