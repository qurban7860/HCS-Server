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
    if (!req.params.machineId || !mongoose.Types.ObjectId.isValid(req.params.machineId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        code: StatusCodes.BAD_REQUEST,
        message: 'Invalid machine ID provided'
      });
    }

    this.machine = req.params.machineId;
    const statistics = await calculateMachineStatistics(this.machine);
    
    if (statistics.error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        code: StatusCodes.INTERNAL_SERVER_ERROR,
        message: statistics.error
      });
    }

    return res.status(StatusCodes.OK).json({
      status: 'success',
      code: StatusCodes.OK,
      data: statistics
    });

  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      message: error?.message || "Dashboard Statistics Fetch Failed!"
    });
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
          componentLength: { $exists: true },
          waste: { $exists: true },
          time: { $exists: true }
        }
      },
      {
        $addFields: {
          numComponentLength: {
            $convert: {
              input: {
                $cond: [
                  {
                    $or: [
                      { $eq: [{ $type: "$componentLength" }, "null"] },
                      { $eq: [{ $type: "$componentLength" }, "missing"] },
                      { $eq: ["$componentLength", ""] },
                      {
                        $not: {
                          $regexMatch: {
                            input: { $ifNull: ["$componentLength", "0"] },
                            regex: /^-?\d*\.?\d+$/
                          }
                        }
                      }
                    ]
                  },
                  "0",
                  {
                    $replaceAll: {
                      input: { $ifNull: ["$componentLength", "0"] },
                      find: ",",
                      replacement: ""
                    }
                  }
                ]
              },
              to: "double",
              onError: 0,
              onNull: 0
            }
          },
          numWaste: {
            $convert: {
              input: {
                $cond: [
                  {
                    $or: [
                      { $eq: [{ $type: "$waste" }, "null"] },
                      { $eq: [{ $type: "$waste" }, "missing"] },
                      { $eq: ["$waste", ""] },
                      {
                        $not: {
                          $regexMatch: {
                            input: { $ifNull: ["$waste", "0"] },
                            regex: /^-?\d*\.?\d+$/
                          }
                        }
                      }
                    ]
                  },
                  "0",
                  {
                    $replaceAll: {
                      input: { $ifNull: ["$waste", "0"] },
                      find: ",",
                      replacement: ""
                    }
                  }
                ]
              },
              to: "double",
              onError: 0,
              onNull: 0
            }
          },
          numTime: {
            $convert: {
              input: {
                $cond: [
                  {
                    $or: [
                      { $eq: [{ $type: "$time" }, "null"] },
                      { $eq: [{ $type: "$time" }, "missing"] },
                      { $eq: ["$time", ""] },
                      {
                        $not: {
                          $regexMatch: {
                            input: { $ifNull: ["$time", "0"] },
                            regex: /^-?\d*\.?\d+$/
                          }
                        }
                      }
                    ]
                  },
                  "0",
                  {
                    $replaceAll: {
                      input: { $ifNull: ["$time", "0"] },
                      find: ",",
                      replacement: ""
                    }
                  }
                ]
              },
              to: "double",
              onError: 0,
              onNull: 0
            }
          }
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
          producedLength: { $round: ["$totalComponentLength", 2] },
          wasteLength: { $round: ["$totalWaste", 2] },
          productionRate: {
            $round: [
              {
                $cond: [
                  { $eq: ["$totalTime", 0] },
                  0,
                  { $divide: [{ $add: ["$totalComponentLength", "$totalWaste"] }, "$totalTime"] }
                ]
              },
              2
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
    throw new Error("Failed to calculate machine statistics: " + error.message);
  }
}
