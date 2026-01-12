const { Vehicle } = require('../models');
const { successResponse } = require('../utils/response');
const { NotFoundError, ValidationError } = require('../utils/CustomError');

const addVehicle = async (req, res, next) => {
  try {
    const { licensePlate, type, model, color } = req.body;
    const userId = req.user.id;

    // Check if plate already exists
    const existing = await Vehicle.findOne({ where: { licensePlate } });
    if (existing) {
      throw new ValidationError('A vehicle with this license plate is already registered');
    }

    const vehicle = await Vehicle.create({
      userId,
      licensePlate,
      type,
      model,
      color
    });

    successResponse(res, { vehicle }, 'Vehicle added successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getMyVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.findAll({ where: { userId: req.user.id } });
    successResponse(res, { vehicles }, 'Vehicles retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { model, color, photo } = req.body;
    
    const vehicle = await Vehicle.findOne({ where: { id, userId: req.user.id } });
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    await vehicle.update({ model, color, photo });
    successResponse(res, { vehicle }, 'Vehicle updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findOne({ where: { id, userId: req.user.id } });
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    await vehicle.destroy();
    successResponse(res, null, 'Vehicle deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addVehicle,
  getMyVehicles,
  updateVehicle,
  deleteVehicle
};
