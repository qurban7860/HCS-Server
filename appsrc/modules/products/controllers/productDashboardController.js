const { validationResult } = require('express-validator');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const LZString = require('lz-string');
const logger = require('../../config/logger');
let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();
const clients = new Map();
const { ErpLog } = require('../../productLogs/models');
const mongoose = require('mongoose');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' }
];

exports.getProductDashboard = async (req, res, next) => {
  try {
    this.machine = req.params.machineId;
    
    const statistics = await calculateMachineStatistics(this.machine);
    
    res.json(statistics);
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Dashboard Statistics Fetch Failed!");
  }
};

/**
 * Calculate machine statistics from erpLog collection
 * @param {string} machineId - The machine ID to calculate statistics for
 * @returns {Object} - Object containing the calculated statistics
 */
async function calculateMachineStatistics(machineId) {
  try {
    const aggregationPipeline = [
      {
        $match: {
          machine: mongoose.Types.ObjectId(machineId),
          componentLength: { $exists: true, $ne: null, $ne: "" },
          waste: { $exists: true, $ne: null, $ne: "" },
          time: { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $addFields: {
          cleanComponentLength: {
            $replaceAll: {
              input: "$componentLength",
              find: ",",
              replacement: ""
            }
          },
          cleanWaste: {
            $replaceAll: {
              input: "$waste",
              find: ",",
              replacement: ""
            }
          },
          cleanTime: {
            $replaceAll: {
              input: "$time",
              find: ",",
              replacement: ""
            }
          }
        }
      },
      {
        $addFields: {
          numComponentLength: { $toDouble: "$cleanComponentLength" },
          numWaste: { $toDouble: "$cleanWaste" },
          numTime: { $toDouble: "$cleanTime" }
        }
      },
      {
        $group: {
          _id: null,
          totalComponentLength: { $sum: "$numComponentLength" },
          totalWaste: { $sum: "$numWaste" },
          totalTime: { $sum: "$numTime" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          producedLength: "$totalComponentLength",
          wasteLength: "$totalWaste",
          productionRate: {
            $cond: [
              { $eq: ["$totalTime", 0] },
              0,
              { $divide: [{ $add: ["$totalComponentLength", "$totalWaste"] }, "$totalTime"] }
            ]
          },
          recordCount: "$count"
        }
      }
    ];

    const result = await ErpLog.aggregate(aggregationPipeline);
    
    return result.length > 0 ? result[0] : {
      producedLength: 0,
      wasteLength: 0,
      productionRate: 0,
      recordCount: 0
    };
  } catch (error) {
    console.error("Error calculating machine statistics:", error);
    return {
      producedLength: 0,
      wasteLength: 0,
      productionRate: 0,
      recordCount: 0,
      error: error.message
    };
  }
}
