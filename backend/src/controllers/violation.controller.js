/**
 * Violation Controller - Enhanced for UI
 * Handles violation detection, resolution, and statistics
 */

const { Violation, ParkingZone, User } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { Op } = require('sequelize');

/**
 * Get all violations with filters
 */
const getAllViolations = async (req, res, next) => {
  try {
    const { zoneName, status, severity, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    
    // Filter by resolution status
    if (status === 'pending') {
      where.resolved = false;
    } else if (status === 'resolved' || status === 'paid') {
      where.resolved = true;
    }
    
    // Filter by severity
    if (severity) {
      where.severity = severity;
    }
    
    // Build include for zone search
    const include = [{
      model: ParkingZone,
      as: 'zone',
      attributes: ['id', 'name', 'address']
    }];
    
    // If zoneName provided, filter by zone name
    if (zoneName) {
      include[0].where = {
        name: { [Op.like]: `%${zoneName}%` }
      };
      include[0].required = true;
    }
    
    const { count, rows: violations } = await Violation.findAndCountAll({
      where,
      include,
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      success: true,
      data: violations,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get violation statistics summary
 */
const getViolationStats = async (req, res, next) => {
  try {
    // Count violations by resolved status
    const pendingViolations = await Violation.count({ where: { resolved: false } });
    const resolvedViolations = await Violation.count({ where: { resolved: true } });
    
    // Count critical violations
    const criticalViolations = await Violation.count({ 
      where: { severity: 'critical', resolved: false } 
    });
    
    // Calculate total penalty amounts
    const totalPenalty = await Violation.sum('penaltyAmount') || 0;
    
    res.json({
      success: true,
      data: {
        summary: {
          pendingViolations,
          resolvedViolations,
          paidViolations: 0, // Field not in DB
          criticalViolations,
          totalPenalty: parseFloat(totalPenalty),
          totalCollected: 0 // Field not in DB
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resolve a violation
 */
const resolveViolation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const violation = await Violation.findByPk(id);
    
    if (!violation) {
      return errorResponse(res, 'Violation not found', 404);
    }
    
    if (violation.resolved) {
      return errorResponse(res, 'Violation already resolved', 400);
    }
    
    // Update violation
    await violation.update({
      resolved: true,
      resolvedAt: new Date(),
      notes: notes || ''
    });
    
    res.json({
      success: true,
      message: 'Violation marked as resolved',
      data: { violation }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new violation (auto-detection or manual)
 */
const createViolation = async (req, res, next) => {
  try {
    const { zoneId, severity, excessVehicles, description } = req.body;
    
    // Validate zone exists
    const zone = await ParkingZone.findByPk(zoneId);
    if (!zone) {
      return errorResponse(res, 'Parking zone not found', 404);
    }
    
    // Calculate penalty (₹500 per excess vehicle)
    const penaltyAmount = (excessVehicles || 0) * 500;
    
    const violation = await Violation.create({
      zoneId,
      severity: severity || 'warning',
      excessVehicles: excessVehicles || 0,
      penaltyAmount,
      resolved: false,
      notes: description || `Excess parking detected at ${zone.name}`,
      timestamp: new Date()
    });
    
    res.status(201).json({
      success: true,
      message: 'Violation created successfully',
      data: { violation }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a violation (admin only)
 */
const deleteViolation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const violation = await Violation.findByPk(id);
    if (!violation) {
      return errorResponse(res, 'Violation not found', 404);
    }
    
    await violation.destroy();
    
    res.json({
      success: true,
      message: 'Violation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export violations as CSV
 */
const exportViolations = async (req, res, next) => {
  try {
    const violations = await Violation.findAll({
      include: [{
        model: ParkingZone,
        as: 'zone',
        attributes: ['name', 'address', 'contractorName']
      }],
      order: [['timestamp', 'DESC']]
    });

    // Define CSV header
    let csv = 'ID,Zone Name,Severity,Excess Vehicles,Penalty Amount,Resolved,Timestamp,Notes\n';

    // Add data rows
    violations.forEach(v => {
      const zoneName = v.zone ? `"${v.zone.name}"` : 'N/A';
      const notes = v.notes ? `"${v.notes.replace(/"/g, '""')}"` : '';
      const timestamp = new Date(v.timestamp).toLocaleString();
      
      csv += `${v.id},${zoneName},${v.severity},${v.excessVehicles},${v.penaltyAmount},${v.resolved ? 'Yes' : 'No'},"${timestamp}",${notes}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`mcd_violations_export_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllViolations,
  getViolationStats,
  resolveViolation,
  createViolation,
  deleteViolation,
  exportViolations
};
