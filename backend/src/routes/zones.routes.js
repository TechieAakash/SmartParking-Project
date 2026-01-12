const express = require('express');
const router = express.Router();
const { ParkingZone, Violation, ParkingSlot, sequelize } = require('../models');
const { Op } = require('sequelize');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Get all parking zones with optional filters
router.get('/', async (req, res, next) => {
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
    
    // Role-based data scoping
    if (req.user && req.user.role === 'viewer') {
      const user = await User.findByPk(req.user.id, {
        include: [{ model: ParkingZone, as: 'assignedZones', attributes: ['id'] }]
      });
      const assignedZoneIds = user.assignedZones ? user.assignedZones.map(z => z.id) : [];
      whereConditions.id = { [Op.in]: assignedZoneIds };
    }

    if (status) whereConditions.status = status;
    if (contractor) whereConditions.contractorName = { [Op.like]: `%${contractor}%` };
    
    if (minOccupancy || maxOccupancy) {
      whereConditions.currentOccupancy = {};
      if (minOccupancy) whereConditions.currentOccupancy[Op.gte] = parseInt(minOccupancy);
      if (maxOccupancy) whereConditions.currentOccupancy[Op.lte] = parseInt(maxOccupancy);
    }
    
    const zones = await ParkingZone.findAll({
      where: whereConditions,
      order: [[sortBy, order.toUpperCase()]],
      include: [{
        model: Violation,
        as: 'violations',
        required: false
      }]
    });
    
    // Virtuals are already handled by model instance methods if called explicitly
    const zonesWithVirtuals = zones.map(zone => {
      const zoneObj = zone.toJSON();
      zoneObj.occupancyPercentage = zone.getOccupancyPercentage();
      zoneObj.violationStatus = zone.getViolationStatus();
      zoneObj.excessVehicles = zone.getExcessVehicles();
      return zoneObj;
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
      data: zoneObj
    });
  } catch (error) {
    next(error);
  }
});

// Create new parking zone (admin only)
router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const zoneData = {
      ...req.body,
      // Map 'name' from body if sent (which is common from frontend as per user request)
      name: req.body.name || req.body.zoneName, 
      currentOccupancy: req.body.currentOccupancy || 0
    };
    
    // Validate occupancy doesn't exceed capacity
    if (zoneData.currentOccupancy > zoneData.totalCapacity) {
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
      data: zoneObj
    });
  } catch (error) {
    next(error);
  }
});

// Update parking zone occupancy
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
    const currentOccupancy = zone.currentOccupancy || 0;
    const totalCapacity = zone.totalCapacity || 0;
    const contractorLimit = zone.contractorLimit || 0;
    const penaltyPerVehicle = zone.penaltyPerVehicle || 500;
    
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
    
    const excessVehicles = Math.max(0, newOccupancy - contractorLimit);

    await sequelize.transaction(async (t) => {
      await zone.update({ currentOccupancy: newOccupancy }, { transaction: t });
      
      const existingViolation = await Violation.findOne({
        where: {
          zoneId: zone.id,
          status: 'pending'
        },
        transaction: t
      });

      // 1. Create violation if there are excess vehicles and no pending one
      if (excessVehicles > 0 && !existingViolation) {
        const severity = excessVehicles > contractorLimit * 0.3 ? 'critical' : 'warning';
        await Violation.create({
          zoneId: zone.id,
          excessVehicles: excessVehicles,
          penaltyAmount: excessVehicles * penaltyPerVehicle,
          severity: severity,
          status: 'pending',
          autoGenerated: true,
          uniqueCode: `AUTO-${zone.id}-${Date.now()}`,
          notes: `System detected ${excessVehicles} excess vehicles.`
        }, { transaction: t });
      } 
      // 2. Auto-resolve if occupancy is back in limit and a pending violation exists
      else if (excessVehicles === 0 && existingViolation) {
        await existingViolation.update({
          status: 'resolved',
          resolvedAt: new Date(),
          notes: (existingViolation.notes ? existingViolation.notes + '\n' : '') + 'Auto-resolved: Occupancy returned within limits.'
        }, { transaction: t });
      }
      // 3. Update existing violation details if vehicles changed but still in violation
      else if (excessVehicles > 0 && existingViolation) {
        const severity = excessVehicles > contractorLimit * 0.3 ? 'critical' : 'warning';
        await existingViolation.update({
          excessVehicles: excessVehicles,
          penaltyAmount: excessVehicles * penaltyPerVehicle,
          severity: severity
        }, { transaction: t });
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
      data: zoneObj,
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
    delete updateData.currentOccupancy;
    
    await zone.update(updateData);
    const updatedZone = await ParkingZone.findByPk(zone.id);
    const zoneObj = updatedZone.toJSON();
    zoneObj.occupancyPercentage = updatedZone.getOccupancyPercentage();
    zoneObj.violationStatus = updatedZone.getViolationStatus();
    zoneObj.excessVehicles = updatedZone.getExcessVehicles();
    
    res.json({
      success: true,
      message: 'Parking zone updated successfully',
      data: zoneObj
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
        [sequelize.literal("COUNT(CASE WHEN status = 'active' THEN 1 END)"), 'activeZones'],
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
      const penaltyPerVehicle = zone.penaltyPerVehicle || 500;
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

// Get slots for a specific zone
router.get('/:id/slots', async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('Fetching slots for zone:', id);
    console.log('ParkingSlot model defined:', !!ParkingSlot);
    console.log('Op defined:', !!Op);
    
    let slots = await ParkingSlot.findAll({
      where: { [Op.or]: [{ zoneId: id }, { zone_id: id }] },
      order: [['slotNumber', 'ASC']]
    });

    // Fallback: If no slots exist in DB, generate dummy slots based on zone capacity
    if (slots.length === 0) {
      const zone = await ParkingZone.findByPk(id);
      if (zone) {
        const capacity = Math.min(zone.totalCapacity, 100); // Limit dummy slots to 100
        slots = Array.from({ length: capacity }, (_, i) => ({
          id: `dummy-${id}-${i+1}`,
          zoneId: id,
          slotNumber: `S-${i+1}`,
          status: i % 5 === 0 ? (i % 10 === 0 ? 'maintenance' : 'occupied') : 'available',
          type: 'car'
        }));
      }
    }

    res.json({
      success: true,
      data: { slots }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
