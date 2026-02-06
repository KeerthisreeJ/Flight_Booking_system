const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Flight = require('../models/Flight');
const Crew = require('../models/Crew');

/**
 * @route   GET /api/flights
 * @desc    Get all flights or search flights
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const { from, to, date } = req.query;

        let query = { status: 'active' };

        if (from) query['from.code'] = from;
        if (to) query['to.code'] = to;

        const flights = await Flight.find(query)
            .populate('crew.pilot', 'firstName lastName employeeId')
            .populate('crew.coPilot', 'firstName lastName employeeId')
            .populate('crew.cabinCrew', 'firstName lastName employeeId')
            .sort({ departureTime: 1 });

        res.status(200).json({
            success: true,
            count: flights.length,
            flights
        });

    } catch (error) {
        console.error('Fetch flights error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching flights',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/flights/search
 * @desc    Search for flights (legacy endpoint for compatibility)
 * @access  Public
 */
router.get('/search', async (req, res) => {
    try {
        const { from, to, departureDate, passengers } = req.query;

        let query = { status: 'active' };

        if (from) query['from.code'] = from;
        if (to) query['to.code'] = to;

        const flights = await Flight.find(query)
            .populate('crew.pilot', 'firstName lastName')
            .populate('crew.coPilot', 'firstName lastName')
            .sort({ departureTime: 1 });

        res.status(200).json({
            success: true,
            count: flights.length,
            departureDate,
            passengers: passengers || 1,
            flights
        });

    } catch (error) {
        console.error('Flight search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching flights',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/flights/:flightNumber
 * @desc    Get single flight by flight number
 * @access  Public
 */
router.get('/:flightNumber', async (req, res) => {
    try {
        const flight = await Flight.findOne({ flightNumber: req.params.flightNumber })
            .populate('crew.pilot', 'firstName lastName employeeId licenseNumber')
            .populate('crew.coPilot', 'firstName lastName employeeId licenseNumber')
            .populate('crew.cabinCrew', 'firstName lastName employeeId');

        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found'
            });
        }

        res.status(200).json({
            success: true,
            flight
        });

    } catch (error) {
        console.error('Fetch flight error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching flight',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/flights/:flightNumber/status
 * @desc    Get flight status
 * @access  Public
 */
router.get('/:flightNumber/status', async (req, res) => {
    try {
        const flight = await Flight.findOne({ flightNumber: req.params.flightNumber });

        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found'
            });
        }

        const status = {
            flightNumber: flight.flightNumber,
            airline: flight.airline,
            from: flight.from,
            to: flight.to,
            scheduledDeparture: flight.departureTime,
            scheduledArrival: flight.arrivalTime,
            status: flight.status,
            gate: flight.gate || 'TBA',
            terminal: flight.terminal || 'TBA'
        };

        res.status(200).json({
            success: true,
            status
        });

    } catch (error) {
        console.error('Flight status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching flight status',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/flights
 * @desc    Create new flight
 * @access  Private/Admin
 */
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const flight = new Flight(req.body);
        await flight.save();

        res.status(201).json({
            success: true,
            message: 'Flight created successfully',
            flight
        });

    } catch (error) {
        console.error('Create flight error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating flight',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/flights/:id
 * @desc    Update flight
 * @access  Private/Admin
 */
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const flight = await Flight.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('crew.pilot crew.coPilot crew.cabinCrew');

        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Flight updated successfully',
            flight
        });

    } catch (error) {
        console.error('Update flight error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating flight',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/flights/:id
 * @desc    Delete flight
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const flight = await Flight.findById(req.params.id);

        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found'
            });
        }

        // Remove flight from crew assignments
        const crewIds = [
            flight.crew.pilot,
            flight.crew.coPilot,
            ...flight.crew.cabinCrew
        ].filter(id => id);

        if (crewIds.length > 0) {
            await Crew.updateMany(
                { _id: { $in: crewIds } },
                { $pull: { assignedFlights: flight._id } }
            );
        }

        await flight.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Flight deleted successfully'
        });

    } catch (error) {
        console.error('Delete flight error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting flight',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/flights/:id/assign-crew
 * @desc    Assign crew to flight
 * @access  Private/Admin
 */
router.put('/:id/assign-crew', protect, authorize('admin'), async (req, res) => {
    try {
        const { pilotId, coPilotId, cabinCrewIds } = req.body;

        const flight = await Flight.findById(req.params.id);

        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found'
            });
        }

        // Remove old crew assignments
        const oldCrewIds = [
            flight.crew.pilot,
            flight.crew.coPilot,
            ...flight.crew.cabinCrew
        ].filter(id => id);

        if (oldCrewIds.length > 0) {
            await Crew.updateMany(
                { _id: { $in: oldCrewIds } },
                { $pull: { assignedFlights: flight._id } }
            );
        }

        // Assign new crew
        if (pilotId) {
            flight.crew.pilot = pilotId;
            await Crew.findByIdAndUpdate(pilotId, {
                $addToSet: { assignedFlights: flight._id }
            });
        }

        if (coPilotId) {
            flight.crew.coPilot = coPilotId;
            await Crew.findByIdAndUpdate(coPilotId, {
                $addToSet: { assignedFlights: flight._id }
            });
        }

        if (cabinCrewIds && cabinCrewIds.length > 0) {
            flight.crew.cabinCrew = cabinCrewIds;
            await Crew.updateMany(
                { _id: { $in: cabinCrewIds } },
                { $addToSet: { assignedFlights: flight._id } }
            );
        }

        await flight.save();

        const updatedFlight = await Flight.findById(flight._id)
            .populate('crew.pilot', 'firstName lastName employeeId')
            .populate('crew.coPilot', 'firstName lastName employeeId')
            .populate('crew.cabinCrew', 'firstName lastName employeeId');

        res.status(200).json({
            success: true,
            message: 'Crew assigned successfully',
            flight: updatedFlight
        });

    } catch (error) {
        console.error('Assign crew error:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning crew',
            error: error.message
        });
    }
});

module.exports = router;
