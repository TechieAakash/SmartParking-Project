const express = require('express');
const router = express.Router();
const { Violation, ParkingZone, sequelize } = require('../models');
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

// Get all violations with filters
// Contractors can only see violations for their zones
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { 
      status, 
      zoneId, 
      startDate, 
      endDate, 
      minPenalty, 
      maxPenalty,
      resolved = false
    } = req.query;
    
    const whereConditions = {};
    
    if (status) whereConditions.severity = status;
    if (zoneId) whereConditions.zone_id = zoneId;
    
    if (startDate || endDate) {
      whereConditions.timestamp = {};
      if (startDate) whereConditions.timestamp[Op.gte] = new Date(startDate);
      if (endDate) whereConditions.timestamp[Op.lte] = new Date(endDate);
    }
    
    if (minPenalty || maxPenalty) {
      whereConditions.penalty_amount = {};
      if (minPenalty) whereConditions.penalty_amount[Op.gte] = parseFloat(minPenalty);
      if (maxPenalty) whereConditions.penalty_amount[Op.lte] = parseFloat(maxPenalty);
    }
    
    if (resolved === 'true') {
      whereConditions.resolved = true;
    } else if (resolved === 'false') {
      whereConditions.resolved = false;
    }
    
    // For contractors, filter violations by their zones
    if (req.user.role === 'contractor') {
      const contractorZones = await ParkingZone.findAll({
        where: { contractor_name: req.user.full_name },
        attributes: ['id']
      });
      const zoneIds = contractorZones.map(z => z.id);
      if (zoneIds.length > 0) {
        whereConditions.zone_id = { [Op.in]: zoneIds };
      } else {
        // No zones assigned, return empty
        return res.json({
          success: true,
          count: 0,
          data: []
        });
      }
    }

    const violations = await Violation.findAll({
      where: whereConditions,
      include: [{
        model: ParkingZone,
        as: 'zone',
        attributes: ['id', 'name', 'address', 'contractor_name']
      }],
      order: [['timestamp', 'DESC']]
    });
    
    res.json({
      success: true,
      count: violations.length,
      data: violations.map(v => toCamelCase(v.toJSON()))
    });
  } catch (error) {
    next(error);
  }
});

// Get single violation
router.get('/:id', async (req, res, next) => {
  try {
    const violation = await Violation.findByPk(req.params.id, {
      include: [{
        model: ParkingZone,
        as: 'zone',
        attributes: ['id', 'name', 'address', 'contractor_name', 'penalty_per_vehicle']
      }]
    });
    
    if (!violation) {
      return res.status(404).json({
        success: false,
        error: 'Violation not found'
      });
    }
    
    res.json({
      success: true,
      data: toCamelCase(violation.toJSON())
    });
  } catch (error) {
    next(error);
  }
});

// Create new violation (officer and admin only)
router.post('/', authenticate, authorize('admin', 'officer'), async (req, res, next) => {
  try {
    const inputData = toSnakeCase(req.body);
    const zoneId = inputData.zone_id;
    const excessVehicles = inputData.excess_vehicles;
    const notes = inputData.notes;
    
    const zone = await ParkingZone.findByPk(zoneId);
    
    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Parking zone not found'
      });
    }
    
    const penaltyPerVehicle = zone.penalty_per_vehicle || zone.penaltyPerVehicle || 500;
    const contractorLimit = zone.contractor_limit || zone.contractorLimit || 0;
    const penaltyAmount = excessVehicles * penaltyPerVehicle;
    const severity = excessVehicles > contractorLimit * 0.3 ? 'critical' : 'warning';
    
    const violation = await Violation.create({
      zone_id: zoneId,
      excess_vehicles: excessVehicles,
      penalty_amount: penaltyAmount,
      severity: severity,
      notes: notes,
      resolved: false,
      auto_generated: false,
      timestamp: new Date()
    });
    
    res.status(201).json({
      success: true,
      message: 'Violation recorded successfully',
      data: toCamelCase(violation.toJSON())
    });
  } catch (error) {
    next(error);
  }
});

// Resolve violation (officer and admin only)
router.patch('/:id/resolve', authenticate, authorize('admin', 'officer'), async (req, res, next) => {
  try {
    const { paymentReceived, notes } = req.body;
    
    const violation = await Violation.findByPk(req.params.id, {
      include: ['zone']
    });
    
    if (!violation) {
      return res.status(404).json({
        success: false,
        error: 'Violation not found'
      });
    }
    
    const updateData = {
      resolved: true,
      resolved_at: new Date()
    };
    
    if (notes) updateData.notes = notes;
    
    await violation.update(updateData);
    
    res.json({
      success: true,
      message: `Violation ${paymentReceived ? 'marked as paid' : 'resolved'}`,
      data: toCamelCase(violation.toJSON())
    });
  } catch (error) {
    next(error);
  }
});

// Update violation (officer and admin only)
router.put('/:id', authenticate, authorize('admin', 'officer'), async (req, res, next) => {
  try {
    const violation = await Violation.findByPk(req.params.id);
    
    if (!violation) {
      return res.status(404).json({
        success: false,
        error: 'Violation not found'
      });
    }
    
    // Recalculate penalty if excess vehicles changed
    const inputData = toSnakeCase(req.body);
    const excessVehicles = inputData.excess_vehicles;
    const currentExcessVehicles = violation.excess_vehicles || 0;
    if (excessVehicles && excessVehicles !== currentExcessVehicles) {
      const zoneId = violation.zone_id;
      const zone = await ParkingZone.findByPk(zoneId);
      if (zone) {
        const penaltyPerVehicle = zone.penalty_per_vehicle || 500;
        inputData.penalty_amount = excessVehicles * penaltyPerVehicle;
      }
    }
    
    await violation.update(inputData);
    
    res.json({
      success: true,
      message: 'Violation updated successfully',
      data: toCamelCase(violation.toJSON())
    });
  } catch (error) {
    next(error);
  }
});

// Delete violation (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const violation = await Violation.findByPk(req.params.id);
    
    if (!violation) {
      return res.status(404).json({
        success: false,
        error: 'Violation not found'
      });
    }
    
    await violation.destroy();
    
    res.json({
      success: true,
      message: 'Violation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get violation statistics (officer and admin only)
router.get('/stats/summary', authenticate, authorize('admin', 'officer'), async (req, res, next) => {
  try {
    const stats = await Violation.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalViolations'],
        [sequelize.fn('SUM', sequelize.col('penalty_amount')), 'totalPenaltyAmount'],
        [sequelize.fn('SUM', sequelize.col('excess_vehicles')), 'totalExcessVehicles'],
        [sequelize.literal('COUNT(CASE WHEN resolved = 0 THEN 1 END)'), 'pendingViolations'],
        [sequelize.literal('COUNT(CASE WHEN resolved = 1 THEN 1 END)'), 'resolvedViolations']
      ],
      raw: true
    });
    
    const monthlyStats = await Violation.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('timestamp'), '%Y-%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('penalty_amount')), 'totalPenalty'],
        [sequelize.fn('AVG', sequelize.col('excess_vehicles')), 'avgExcessVehicles']
      ],
      group: ['month'],
      order: [['month', 'DESC']],
      limit: 6,
      raw: true
    });
    
    res.json({
      success: true,
      data: {
        overall: stats[0],
        monthly: monthlyStats
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get violations by zone
router.get('/zone/:zoneId', authenticate, async (req, res, next) => {
  try {
    const zone = await ParkingZone.findByPk(req.params.zoneId);
    
    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Parking zone not found'
      });
    }
    
    const violations = await Violation.findAll({
      where: { zone_id: req.params.zoneId },
      include: [{
        model: ParkingZone,
        as: 'zone',
        attributes: ['id', 'name', 'address']
      }],
      order: [['timestamp', 'DESC']]
    });
    
    res.json({
      success: true,
      zone: {
        id: zone.id,
        name: zone.name,
        address: zone.address
      },
      count: violations.length,
      data: violations.map(v => toCamelCase(v.toJSON()))
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;