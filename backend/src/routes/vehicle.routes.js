const express = require('express');
const router = express.Router();
const { addVehicle, getMyVehicles, updateVehicle, deleteVehicle } = require('../controllers/vehicle.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// All vehicle routes are protected
router.use(authenticate);

router.post('/', addVehicle);
router.get('/my', getMyVehicles);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

module.exports = router;
