const Drone = require('../models/Drone');
const DeliveryMission = require('../models/DeliveryMission');
const logger = require('../utils/logger');

// Get drone statistics
const getStatistics = async (req, res) => {
  try {
    const { timeRange = 'today' } = req.query;
    
    // Calculate date range
    let startDate, endDate;
    const now = new Date();
    
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        endDate = new Date();
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        endDate = new Date();
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
    }

    const [
      totalDrones,
      activeDrones,
      idleDrones,
      inFlightDrones,
      maintenanceDrones,
      totalMissions,
      completedMissions,
      inProgressMissions,
      failedMissions
    ] = await Promise.all([
      Drone.countDocuments(),
      Drone.countDocuments({ status: 'active' }),
      Drone.countDocuments({ status: 'idle' }),
      Drone.countDocuments({ status: 'in_flight' }),
      Drone.countDocuments({ status: 'maintenance' }),
      DeliveryMission.countDocuments(),
      DeliveryMission.countDocuments({ status: 'completed' }),
      DeliveryMission.countDocuments({ status: { $in: ['assigned', 'in_progress', 'returning'] } }),
      DeliveryMission.countDocuments({ status: 'failed' })
    ]);

    // Drone status distribution
    const droneStatusDistribution = await Drone.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Mission status distribution
    const missionStatusDistribution = await DeliveryMission.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Average battery levels
    const avgBatteryLevel = await Drone.aggregate([
      { $match: { status: { $ne: 'maintenance' } } },
      { $group: { _id: null, avgBattery: { $avg: '$batteryPercent' } } }
    ]);

    // Mission completion rate
    const completionRate = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

    // Flight time statistics
    const flightTimeStats = await DeliveryMission.aggregate([
      {
        $match: {
          status: 'completed',
          startTime: { $exists: true },
          endTime: { $exists: true }
        }
      },
      {
        $project: {
          duration: {
            $divide: [
              { $subtract: ['$endTime', '$startTime'] },
              1000 * 60 // Convert to minutes
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgFlightTime: { $avg: '$duration' },
          totalFlightTime: { $sum: '$duration' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        drones: {
          total: totalDrones,
          active: activeDrones,
          idle: idleDrones,
          inFlight: inFlightDrones,
          maintenance: maintenanceDrones,
          averageBattery: avgBatteryLevel[0]?.avgBattery || 0,
          statusDistribution: droneStatusDistribution
        },
        missions: {
          total: totalMissions,
          completed: completedMissions,
          inProgress: inProgressMissions,
          failed: failedMissions,
          completionRate,
          statusDistribution: missionStatusDistribution,
          flightStats: flightTimeStats[0] || {}
        },
        timeRange
      }
    });
  } catch (error) {
    logger.error('Get drone statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drone statistics'
    });
  }
};

// Get drone overview
const getOverview = async (req, res) => {
  try {
    // Drone status overview
    const droneStatusOverview = await Drone.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Mission status overview
    const missionStatusOverview = await DeliveryMission.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent missions
    const recentMissions = await DeliveryMission.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('missionId status droneId startTime endTime')
      .populate('droneId', 'name model');

    // Low battery drones
    const lowBatteryDrones = await Drone.find({
      batteryPercent: { $lt: 30 },
      status: { $ne: 'maintenance' }
    })
    .select('name model batteryPercent status')
    .limit(10);

    // Performance metrics
    const performanceStats = await DeliveryMission.aggregate([
      {
        $group: {
          _id: null,
          totalMissions: { $sum: 1 },
          successRate: {
            $avg: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        droneStatusOverview,
        missionStatusOverview,
        recentMissions,
        lowBatteryDrones,
        performance: performanceStats[0] || {},
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    logger.error('Get drone overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drone overview'
    });
  }
};

module.exports = {
  getStatistics,
  getOverview
};
