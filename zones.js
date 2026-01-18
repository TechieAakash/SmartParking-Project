const express = require('express');
const router = express.Router();
const { ParkingZone, Violation, sequelize } = require('../models');
const { Op } = require('sequelize');
const { authenticate, authorize } = require('../middleware/auth');

// Helper function to convert snake_case to camelCase
function toCamelCase(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== 'object') return obj;
  
  const camelObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      camelObj[camelKey] = toCamelCase(obj[key]);
    }
  }
  return camelObj;
}

// Helper function to convert camelCase to snake_case
function toSnakeCase(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (typeof obj !== 'object') return obj;
  
  const snakeObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      snakeObj[snakeKey] = toSnakeCase(obj[key]);
    }
  }
  return snakeObj;
}

// Get all parking zones with optional filters
// Contractors can only see their assigned zones, officers and admin can see all
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { 
      status, 
      minOccupancy, 
      maxOccupancy, 
      contractor, 
      sortBy = 'name', 
      order = 'ASC' 
    } = req.query;
    
    const whereConditions = {};
    
    if (status) whereConditions.status = status;
    if (contractor) whereConditions.contractor_name = { [Op.like]: `%${contractor}%` };
    
    if (minOccupancy || maxOccupancy) {
      whereConditions.current_occupancy = {};
      if (minOccupancy) whereConditions.current_occupancy[Op.gte] = parseInt(minOccupancy);
      if (maxOccupancy) whereConditions.current_occupancy[Op.lte] = parseInt(maxOccupancy);
    }
    
    // Convert sortBy to snake_case if needed
    const sortField = sortBy === 'name' ? 'name' : 
                      sortBy === 'totalCapacity' ? 'total_capacity' :
                      sortBy === 'currentOccupancy' ? 'current_occupancy' :
                      sortBy === 'contractorName' ? 'contractor_name' :
                      sortBy;
    
    const zones = await ParkingZone.findAll({
      where: whereConditions,
      order: [[sortField, order.toUpperCase()]],
      include: [{
        model: Violation,
        as: 'violations',
        required: false
      }]
    });
    
    // Add virtual properties and convert to camelCase
    const zonesWithVirtuals = zones.map(zone => {
      const zoneObj = zone.toJSON();
      zoneObj.occupancyPercentage = zone.getOccupancyPercentage();
      zoneObj.violationStatus = zone.getViolationStatus();
      zoneObj.excessVehicles = zone.getExcessVehicles();
      return toCamelCase(zoneObj);
    });
    
    res.json({
      success: true,
      count: zonesWithVirtuals.length,
      data: zonesWithVirtuals
    });
  } catch (error) {
    next(error);
  }
});

// Get single parking zone by ID
router.get('/:id', async (req, res, next) => {
  try {
    const zone = await ParkingZone.findByPk(req.params.id, {
      include: [{
        model: Violation,
        as: 'violations',
        required: false
      }]
    });
    
    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Parking zone not found'
      });
    }
    
    const zoneObj = zone.toJSON();
    zoneObj.occupancyPercentage = zone.getOccupancyPercentage();
    zoneObj.violationStatus = zone.getViolationStatus();
    zoneObj.excessVehicles = zone.getExcessVehicles();
    
    res.json({
      success: true,
      data: toCamelCase(zoneObj)
    });
  } catch (error) {
    next(error);
  }
});

// Create new parking zone (officer and admin only)
router.post('/', authenticate, authorize('admin', 'officer'), async (req, res, next) => {
  try {
    // Convert camelCase input to snake_case for database
    const inputData = toSnakeCase(req.body);
    const zoneData = {
      ...inputData,
      current_occupancy: inputData.current_occupancy || 0
    };
    
    // Validate occupancy doesn't exceed capacity
    if (zoneData.current_occupancy > zoneData.total_capacity) {
      return res.status(400).json({
        success: false,
        error: 'Occupancy cannot exceed total capacity'
      });
    }
    
    const zone = await ParkingZone.create(zoneData);
    const zoneObj = zone.toJSON();
    zoneObj.occupancyPercentage = zone.getOccupancyPercentage();
    zoneObj.violationStatus = zone.getViolationStatus();
    zoneObj.excessVehicles = zone.getExcessVehicles();
    
    res.status(201).json({
      success: true,
      message: 'Parking zone created successfully',
      data: toCamelCase(zoneObj)
    });
  } catch (error) {
    next(error);
  }
});

// Update parking zone occupancy (contractors can update their zones, officers and admin can update any)
router.patch('/:id/occupancy', authenticate, async (req, res, next) => {
  try {
    const { occupancyChange, absoluteOccupancy } = req.body;
    
    const zone = await ParkingZone.findByPk(req.params.id);
    
    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Parking zone not found'
      });
    }
    
    let newOccupancy;
    const currentOccupancy = zone.current_occupancy || zone.currentOccupancy || 0;
    const totalCapacity = zone.total_capacity || zone.totalCapacity || 0;
    const contractorLimit = zone.contractor_limit || zone.contractorLimit || 0;
    const penaltyPerVehicle = zone.penalty_per_vehicle || zone.penaltyPerVehicle || 500;
    
    if (absoluteOccupancy !== undefined) {
      newOccupancy = parseInt(absoluteOccupancy);
    } else if (occupancyChange !== undefined) {
      newOccupancy = currentOccupancy + parseInt(occupancyChange);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Provide either occupancyChange or absoluteOccupancy'
      });
    }
    
    // Validate new occupancy
    if (newOccupancy < 0) {
      return res.status(400).json({
        success: false,
        error: 'Occupancy cannot be negative'
      });
    }
    
    if (newOccupancy > totalCapacity) {
      return res.status(400).json({
        success: false,
        error: 'Occupancy cannot exceed total capacity'
      });
    }
    
    // Check for violation
    const excessVehicles = Math.max(0, newOccupancy - contractorLimit);
    
    await sequelize.transaction(async (t) => {
      await zone.update({ current_occupancy: newOccupancy }, { transaction: t });
      
      // Create violation if there are excess vehicles
      if (excessVehicles > 0) {
        const existingViolation = await Violation.findOne({
          where: {
            zone_id: zone.id,
            resolved: false
          },
          transaction: t
        });
        
        if (!existingViolation) {
          const severity = excessVehicles > contractorLimit * 0.3 ? 'critical' : 'warning';
          await Violation.create({
            zone_id: zone.id,
            excess_vehicles: excessVehicles,
            penalty_amount: excessVehicles * penaltyPerVehicle,
            severity: severity,
            resolved: false,
            auto_generated: true,
            notes: `Automatically generated: ${excessVehicles} excess vehicles`
          }, { transaction: t });
        }
      }
    });
    
    const updatedZone = await ParkingZone.findByPk(zone.id);
    const zoneObj = updatedZone.toJSON();
    zoneObj.occupancyPercentage = updatedZone.getOccupancyPercentage();
    zoneObj.violationStatus = updatedZone.getViolationStatus();
    zoneObj.excessVehicles = updatedZone.getExcessVehicles();
    
    res.json({
      success: true,
      message: 'Occupancy updated successfully',
      data: toCamelCase(zoneObj),
      violationCreated: excessVehicles > 0
    });
  } catch (error) {
    next(error);
  }
});

// Update parking zone (officer and admin only)
router.put('/:id', authenticate, authorize('admin', 'officer'), async (req, res, next) => {
  try {
    const zone = await ParkingZone.findByPk(req.params.id);
    
    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Parking zone not found'
      });
    }
    
    // Don't allow updating occupancy through this endpoint
    const updateData = { ...req.body };
    delete updateData.current_occupancy;
    delete updateData.currentOccupancy;
    
    await zone.update(toSnakeCase(updateData));
    const updatedZone = await ParkingZone.findByPk(zone.id);
    const zoneObj = updatedZone.toJSON();
    zoneObj.occupancyPercentage = updatedZone.getOccupancyPercentage();
    zoneObj.violationStatus = updatedZone.getViolationStatus();
    zoneObj.excessVehicles = updatedZone.getExcessVehicles();
    
    res.json({
      success: true,
      message: 'Parking zone updated successfully',
      data: toCamelCase(zoneObj)
    });
  } catch (error) {
    next(error);
  }
});

// Delete parking zone (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const zone = await ParkingZone.findByPk(req.params.id);
    
    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Parking zone not found'
      });
    }
    
    await zone.destroy();
    
    res.json({
      success: true,
      message: 'Parking zone deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get statistics (officer and admin only)
router.get('/stats/overview', authenticate, authorize('admin', 'officer'), async (req, res, next) => {
  try {
    const stats = await ParkingZone.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalZones'],
        [sequelize.fn('SUM', sequelize.col('total_capacity')), 'totalCapacity'],
        [sequelize.fn('SUM', sequelize.col('current_occupancy')), 'totalOccupancy'],
        [sequelize.fn('AVG', sequelize.col('current_occupancy')), 'avgOccupancy'],
        [sequelize.literal('COUNT(CASE WHEN status = "active" THEN 1 END)'), 'activeZones'],
        [sequelize.literal('COUNT(CASE WHEN current_occupancy > contractor_limit THEN 1 END)'), 'violatingZones']
      ],
      raw: true
    });
    
    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    next(error);
  }
});

// Check for violations across all zones (officer and admin only)
router.get('/check/violations', authenticate, authorize('admin', 'officer'), async (req, res, next) => {
  try {
    const violatingZones = await ParkingZone.findViolations();
    
    const result = violatingZones.map(zone => {
      const zoneObj = zone.toJSON();
      zoneObj.excessVehicles = zone.getExcessVehicles();
      const penaltyPerVehicle = zone.penalty_per_vehicle || zone.penaltyPerVehicle || 500;
      zoneObj.penaltyAmount = zone.getExcessVehicles() * penaltyPerVehicle;
      return zoneObj;
    });
    
    res.json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;