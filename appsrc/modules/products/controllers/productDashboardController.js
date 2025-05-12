const { validationResult } = require("express-validator");
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require("http-status-codes");
const LZString = require("lz-string");
const logger = require("../../config/logger");
let productDBService = require("../service/productDBService");
this.dbservice = new productDBService();
const clients = new Map();
const { ErpLog } = require("../../productLogs/models");
const mongoose = require("mongoose");
var ObjectId = require('mongoose').Types.ObjectId;

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  { path: "createdBy", select: "name" },
  { path: "updatedBy", select: "name" },
];

exports.getProductDashboard = async (req, res, next) => {
  try {
    if (!req.params.machineId || !mongoose.Types.ObjectId.isValid(req.params.machineId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        code: StatusCodes.BAD_REQUEST,
        message: "Invalid machine ID provided",
      });
    }

    this.machine = req.params.machineId;
    const statistics = await calculateMachineStatisticsPipeline(this.machine);

    if (statistics.error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        code: StatusCodes.INTERNAL_SERVER_ERROR,
        message: statistics.error,
      });
    }

    return res.status(StatusCodes.OK).json(statistics);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      message: error?.message || "Dashboard Statistics Fetch Failed!",
    });
  }
};

/**
 * Calculate machine statistics from erpLog collection
 * @param {string} machineId - The machine ID to calculate statistics for
 * @returns {Object} - Object containing the calculated statistics
 */
async function calculateMachineStatisticsPipeline(machineId) {
  try {
    const aggregationPipeline = [
      {
        $match: {
          machine: ObjectId(machineId),
        },
      },
      {
        $addFields: {
          pComponent: {
            $cond: [{ $eq: ["$componentType", "PRODUCTION"] }, 1, 0],
          },

          ComponentLength: {
            $convert: {
              input: "$componentLength",
              to: "double",
              onError: 0,
              onNull: 0,
            },
          },

          wComponent: {
            $cond: [{ $ne: ["$componentType", "PRODUCTION"] }, 1, 0],
          },

          Waste: {
            $convert: {
              input: "$waste",
              to: "double",
              onError: 0,
              onNull: 0,
            },
          },

          initial_WComponent: {
            $cond: [{ $eq: ["$componentType", "WASTE_INITIAL"] }, 1, 0],
          },

          initial_Waste: {
            $cond: [
              { $eq: ["$componentType", "WASTE_INITIAL"] },
              {
                $convert: {
                  input: "$waste",
                  to: "double",
                  onError: 0,
                  onNull: 0,
                },
              },
              0,
            ],
          },

          insertion_WComponent: {
            $cond: [{ $eq: ["$componentType", "WASTE_INSERTION"] }, 1, 0],
          },

          insertion_Waste: {
            $cond: [
              { $eq: ["$componentType", "WASTE_INSERTION"] },
              {
                $convert: {
                  input: "$waste",
                  to: "double",
                  onError: 0,
                  onNull: 0,
                },
              },
              0,
            ],
          },

          manual_WComponent: {
            $cond: [{ $eq: ["$componentType", "WASTE_MANUAL"] }, 1, 0],
          },

          manual_Waste: {
            $cond: [
              { $eq: ["$componentType", "WASTE_MANUAL"] },
              {
                $convert: {
                  input: "$waste",
                  to: "double",
                  onError: 0,
                  onNull: 0,
                },
              },
              0,
            ],
          },

          transition_WComponent: {
            $cond: [{ $eq: ["$componentType", "WASTE_TRANSITION"] }, 1, 0],
          },

          transition_Waste: {
            $cond: [
              { $eq: ["$componentType", "WASTE_TRANSITION"] },
              {
                $convert: {
                  input: "$waste",
                  to: "double",
                  onError: 0,
                  onNull: 0,
                },
              },
              0,
            ],
          },

          Time: {
            $convert: {
              input: "$time",
              to: "double",
              onError: 0,
              onNull: 0,
            },
          },
        },
      },

      {
        $group: {
          _id: null,

          producedComponents: { $sum: "$pComponent" },

          ProducedComponentLengthM: { $sum: { $divide: ["$ComponentLength", 1000.0] } },

          WasteComponents: { $sum: "$wComponent" },

          WasteLengthM: { $sum: { $divide: ["$Waste", 1000.0] } },

          initialWasteComponents: { $sum: "$initial_WComponent" },

          initial_WasteM: { $sum: { $divide: ["$initial_Waste", 1000.0] } },

          insertionWasteComponents: { $sum: "$insertion_WComponent" },

          insertion_WasteM: { $sum: { $divide: ["$insertion_Waste", 1000.0] } },

          manualWasteComponents: { $sum: "$manual_WComponent" },

          manual_WasteM: { $sum: { $divide: ["$manual_Waste", 1000.0] } },

          transitionWasteComponents: { $sum: "$transition_WComponent" },

          transition_WasteM: { $sum: { $divide: ["$transition_Waste", 1000.0] } },

          TimeForProductionHrs: { $sum: { $divide: ["$Time", 3600000.0] } },

          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          generalData: [
            {
              label: "Produced Components",
              count: "$producedComponents",
              length: { $round: ["$ProducedComponentLengthM", 2] },
            },
            {
              label: "Waste Components",
              count: "$WasteComponents",
              length: { $round: ["$WasteLengthM", 2] },
            },
          ],
          wasteData: [
            {
              label: "Initial Waste",
              count: "$initialWasteComponents",
              length: { $round: ["$initial_WasteM", 2] },
            },
            {
              label: "Insertion Waste",
              count: "$insertionWasteComponents",
              length: { $round: ["$insertion_WasteM", 2] },
            },
            {
              label: "Manual Waste",
              count: "$manualWasteComponents",
              length: { $round: ["$manual_WasteM", 2] },
            },
            {
              label: "Transition Waste",
              count: "$transitionWasteComponents",
              length: { $round: ["$transition_WasteM", 2] },
            },
            {
              label: "Kerf Waste",
              count: null,
              length: { $round: [{ $subtract: ["$WasteLengthM", { $add: ["$initial_WasteM", "$insertion_WasteM", "$manual_WasteM", "$transition_WasteM"] }] }, 2] },
            },
          ],
          totalData: [
            {
              label: "Records Count",
              value: "$count",
            },
            {
              label: "Processed Length",
              value: { $round: [{ $add: ["$ProducedComponentLengthM", "$WasteLengthM"] }, 2] },
            },
            {
              label: "Production Speed (m/hr)",
              value: {
                $round: [{ $cond: [{ $eq: ["$TimeForProductionHrs", 0] }, 0, { $divide: [{ $add: ["$ProducedComponentLengthM", "$WasteLengthM"] }, "$TimeForProductionHrs"] }] }, 2],
              },
            },
          ],
        },
      },
    ];

    const result = await ErpLog.aggregate(aggregationPipeline);

    return result;
  } catch (error) {
    console.error("Error calculating machine statistics:", error);
    throw new Error("Failed to calculate machine statistics: " + error.message);
  }
}

exports.getProducedLength = async (req, res, next) => {
  try {
    if (!req.params.machineId || !mongoose.Types.ObjectId.isValid(req.params.machineId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        code: StatusCodes.BAD_REQUEST,
        message: "Invalid machine ID provided",
      });
    }
    const machineId = mongoose.Types.ObjectId(req.params.machineId);

    const logs = await ErpLog.find({
      machine: machineId,
      componentLength: { $exists: true },
      $or: [{ measurementUnit: { $ne: "in" } }, { measurementUnit: { $exists: false } }],
      $or: [{ componentType: { $exists: false } }, { componentType: "PRODUCTION" }],
    });

    const producedLength = logs.reduce((total, log) => {
      const length = parseFloat(log.componentLength?.replace(",", "") || 0);
      return total + (isNaN(length) ? 0 : length);
    }, 0);

    return res.status(StatusCodes.OK).json({
      value: Number(producedLength.toFixed(3)),
      recordCount: logs.length,
    });
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      message: error?.message || "Produced Length Fetch Failed!",
    });
  }
};

exports.getWasteLength = async (req, res, next) => {
  try {
    if (!req.params.machineId || !mongoose.Types.ObjectId.isValid(req.params.machineId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        code: StatusCodes.BAD_REQUEST,
        message: "Invalid machine ID provided",
      });
    }
    const machineId = mongoose.Types.ObjectId(req.params.machineId);

    const logs = await ErpLog.find({
      machine: machineId,
      waste: { $exists: true },
      $or: [{ measurementUnit: { $ne: "in" } }, { measurementUnit: { $exists: false } }],
      $or: [{ componentType: { $exists: false } }, { componentType: { $ne: "PRODUCTION" } }],
    });

    const wasteLength = logs.reduce((total, log) => {
      const waste = parseFloat(log.waste?.replace(",", "") || 0);
      return total + (isNaN(waste) ? 0 : waste);
    }, 0);

    return res.status(StatusCodes.OK).json({
      value: Number(wasteLength.toFixed(3)),
      recordCount: logs.length,
    });
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      message: error?.message || "Waste Length Fetch Failed!",
    });
  }
};

exports.getProductionRate = async (req, res, next) => {
  try {
    if (!req.params.machineId || !mongoose.Types.ObjectId.isValid(req.params.machineId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        code: StatusCodes.BAD_REQUEST,
        message: "Invalid machine ID provided",
      });
    }
    const machineId = mongoose.Types.ObjectId(req.params.machineId);

    const logs = await ErpLog.find({
      machine: machineId,
      componentLength: { $exists: true },
      waste: { $exists: true },
      time: { $exists: true },
      $or: [{ measurementUnit: { $ne: "in" } }, { measurementUnit: { $exists: false } }],
    });

    const result = logs.reduce(
      (acc, log) => {
        const length = parseFloat(log.componentLength?.replace(",", "") || 0);
        const waste = parseFloat(log.waste?.replace(",", "") || 0);
        const time = parseFloat(log.time?.replace(",", "") || 0);

        if (time === 0 || isNaN(time)) {
          return acc;
        }

        return {
          totalLength: acc.totalLength + (isNaN(length) ? 0 : length),
          totalWaste: acc.totalWaste + (isNaN(waste) ? 0 : waste),
          totalTime: acc.totalTime + time,
          validRecords: acc.validRecords + 1,
        };
      },
      { totalLength: 0, totalWaste: 0, totalTime: 0, validRecords: 0 }
    );

    const productionRate = result.totalTime === 0 ? 0 : (result.totalLength + result.totalWaste) / result.totalTime;

    return res.status(StatusCodes.OK).json({
      value: Number(productionRate.toFixed(3)),
      recordCount: result.validRecords,
    });
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      message: error?.message || "Production Rate Fetch Failed!",
    });
  }
};
