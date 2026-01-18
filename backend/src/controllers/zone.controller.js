/**
 * Parking Zone Controller - Updated for new schema and full CRUD
 */

const { ParkingZone, ParkingSlot } = require('../models');
const { successResponse, paginatedResponse } = require('../utils/response');
const { NotFoundError, ValidationError } = require('../utils/CustomError');
const { Op } = require('sequelize');

/**
 * Get all zones with optional filtering
 */
const getAllZones = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } }
      ];
    }
    if (status) where.status = status;


    // Filter by contractor ONLY if explicitly requested via scope='owned'
    // This allows contractors to see ALL zones on the main dashboard, 
    // but filter to just their own on the management page.
    if (req.user && req.user.role === 'contractor' && req.query.scope === 'owned') {
       where.contractorId = req.user.id;
    }

    const zones = await ParkingZone.findAll({ where });
    successResponse(res, zones, 'Zones retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get zone by ID
 */
const getZoneById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const zone = await ParkingZone.findByPk(id);
    if (!zone) throw new NotFoundError('Parking zone not found');
    successResponse(res, { zone }, 'Zone details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create new zone
 */
const createZone = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    
    // Delhi NCR Bounds Validation
    const minLat = 28.40, maxLat = 28.90;
    const minLng = 76.80, maxLng = 77.40;
    
    if (latitude < minLat || latitude > maxLat || longitude < minLng || longitude > maxLng) {
      throw new ValidationError('Parking zone must be located within Delhi NCR boundaries.');
    }

    if (req.user && req.user.role === 'contractor') {
      req.body.contractorId = req.user.id;
    }

    const zone = await ParkingZone.create(req.body);
    successResponse(res, zone, 'Zone created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update zone
 */
const updateZone = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const where = { id };
    if (req.user && req.user.role === 'contractor') {
      where.contractorId = req.user.id;
    }

    const zone = await ParkingZone.findOne({ where });
    if (!zone) throw new NotFoundError('Parking zone not found');
    
    await zone.update(req.body);
    successResponse(res, zone, 'Zone updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete zone
 */
const deleteZone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const zone = await ParkingZone.findByPk(id);
    if (!zone) throw new NotFoundError('Parking zone not found');
    await zone.destroy();
    successResponse(res, null, 'Zone deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get zone statistics summary
 */
const getZoneStats = async (req, res, next) => {
  try {
    const zones = await ParkingZone.findAll();
    const stats = {
      totalZones: zones.length,
      totalCapacity: zones.reduce((sum, z) => sum + (z.totalCapacity || 0), 0),
      occupiedSlots: zones.reduce((sum, z) => sum + (z.currentOccupancy || 0), 0),
    };
    stats.availableSlots = stats.totalCapacity - stats.occupiedSlots;
    stats.occupancyPercentage = stats.totalCapacity > 0 
      ? Math.round((stats.occupiedSlots / stats.totalCapacity) * 100) 
      : 0;
    successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get slots for a specific zone
 */
const getZoneSlots = async (req, res, next) => {
  try {
    const { id, zoneId } = req.params;
    const zid = id || zoneId;
    const slots = await ParkingSlot.findAll({
      where: { zoneId: zid },
      order: [['slotNumber', 'ASC']]
    });
    successResponse(res, { slots }, 'Zone slots retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllZones,
  getZoneById,
  createZone,
  updateZone,
  deleteZone,
  getZoneStats,
  getZoneSlots,
};
