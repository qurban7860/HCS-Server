const { validationResult } = require("express-validator");
const { StatusCodes, getReasonPhrase } = require("http-status-codes");
const _ = require("lodash");

const logger = require("../../config/logger");

let productDBService = require("../service/productDBService");
this.dbservice = new productDBService();

const { ProductTechParam, Product, ProductTechParamValue, MachineStatus, MachineModel } = require("../models");
const Customer = require("../../crm/models/customer");

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
//this.populate = 'category';
this.populate = [
  { path: "createdBy", select: "name" },
  { path: "updatedBy", select: "name" },
  { path: "category", select: "_id name description" },
];
//this.populate = {path: 'category', model: 'MachineCategory', select: '_id name description'};

// exports.getProductTechParam = async (req, res, next) => {
//   this.dbservice.getObjectById(ProductTechParam, this.fields, req.params.id, this.populate, callbackFunc);
//   function callbackFunc(error, response) {
//     if (error) {
//       logger.error(new Error(error));
//       res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
//     } else {
//       res.json(response);
//     }
//   }
// };

exports.getProductTechParamReport = async (req, res) => {
  const techParamCodes = req?.query?.codes || ["HLCSoftwareVersion", "PLCSWVersion"];

  let machineStatus = null;
  if (req.query?.machineStatus && req.query?.machineStatus?.length > 0) {
    const statusArray = req.query.machineStatus?.split(',')
      .map(status => status.trim())
      .filter(status => !["Transferred", "Decommissioned"].includes(status));
      
    if (statusArray.length > 0) {
      machineStatus = statusArray;
    }
  }

  const page = parseInt(req.body?.page) || 0;
  const pageSize = parseInt(req.body?.pageSize) || 100;

  const searchKey = req.query.search?.key;
  const searchColumn = req.query.search?.column;

  let searchStage = [];
  if (searchKey && searchColumn) {
    const validSearchColumns = ["serialNo", "machineModel.name", "customer.name"];

    if (validSearchColumns.includes(searchColumn)) {
      searchStage.push({
        $match: {
          [searchColumn]: { $regex: searchKey, $options: "i" },
        },
      });
    }
  }

  let sortStages = [];
  let sortStage = { $sort: { serialNo: -1 } };

  if (req.query.orderBy) {
    const sortField = Object.keys(req.query.orderBy)[0];
    const sortValue = parseInt(req.query.orderBy[sortField]);

    if (["serialNo", "machineModel.name", "customer.name"].includes(sortField)) {
      sortStage = {
        $sort: { [sortField]: sortValue }
      };
    }
  }

  sortStages.push(sortStage);

  const aggregatePipeline = [
    {
      $lookup: {
        from: 'MachineStatuses',
        localField: 'status',
        foreignField: '_id',
        as: 'status'
      }
    },
    {
      $unwind: '$status'
    },
    {
      $match: machineStatus ? {
        'status.name': { $in: machineStatus }
      } : {
        'status.name': { $nin: ['Transferred', 'Decommissioned'] }
      }
    },
    {
      $lookup: {
        from: 'MachineModels',
        localField: 'machineModel',
        foreignField: '_id',
        as: 'machineModel'
      }
    },
    {
      $unwind: {
        path: '$machineModel',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'Customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'customer'
      }
    },
    {
      $unwind: {
        path: '$customer',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'MachineTechParamValues',
        let: { machineId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$machine', '$machineId'] }
            }
          },
          {
            $lookup: {
              from: 'MachineTechParams',
              localField: 'techParam',
              foreignField: '_id',
              as: 'techParam'
            }
          },
          {
            $unwind: '$techParam'
          },
          {
            $match: {
              'techParam.code': {
                $in: techParamCodes
              }
            }
          }
        ],
        as: 'techParamValues'
      }
    },
    {
      $project: {
        serialNo: 1,
        machineId: '$_id',
        machineModel: {
          _id: '$machineModel._id',
          name: '$machineModel.name'
        },
        customer: {
          _id: '$customer._id',
          name: '$customer.name'
        },
        techParamValues: {
          $map: {
            input: '$techParamValues',
            as: 'tpv',
            in: {
              code: '$tpv.techParam.code',
              value: '$tpv.techParamValue'
            }
          }
        }
      }
    },
    ...sortStages,
    ...searchStage
  ];

  if (page > 0 && pageSize > 0) {
    aggregatePipeline.push(
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize }
    );
  }

  const countPipeline = [...aggregatePipeline];
  countPipeline.push({ 
    $count: 'totalCount' 
  });

  const params = {};

  const countResult = await this.dbservice.getObjectListWithAggregate(Product, countPipeline, params);
  const totalCount = countResult[0]?.totalCount || 0;

  this.dbservice.getObjectListWithAggregate(Product, aggregatePipeline, params, callbackFunc);
  async function callbackFunc(error, paginatedResults) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      const formattedData = paginatedResults.map(machine => ({
        serialNo: machine.serialNo,
        machineId: machine.machineId,
        machineModel: machine.machineModel,
        customer: machine.customer,
        techParamas: techParamCodes.reduce((acc, configCode) => ({
          ...acc,
          [configCode]: machine.techParamValues.find(tpv => 
            tpv.code.includes(configCode)
          )?.value || null
        }), {})
      }));

      res.json({
        currentPage: page,
        pageSize: pageSize,
        totalCount: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        data: formattedData
      });
    }
  }
};
exports.exportProductTechParamReportCsv = async (req, res) => {
  const techParamCodes = req?.query?.codes || [
    { display: "HLC Software Version", code: "HLCSoftwareVersion" },
    { display: "PLC Software Version", code: "PLCSWVersion" },
  ];

  const aggregatePipeline = [
    {
      $lookup: {
        from: 'MachineStatuses',
        localField: 'status',
        foreignField: '_id',
        as: 'status'
      }
    },
    {
      $unwind: '$status'
    },
    {
      $match: {
        'status.name': { $nin: ['Transferred', 'Decommissioned'] }
      }
    },
    {
      $lookup: {
        from: 'MachineModels',
        localField: 'machineModel',
        foreignField: '_id',
        as: 'machineModel'
      }
    },
    {
      $unwind: {
        path: '$machineModel',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'Customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'customer'
      }
    },
    {
      $unwind: {
        path: '$customer',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'MachineTechParamValues',
        let: { machineId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$machine', '$$machineId'] }
            }
          },
          {
            $lookup: {
              from: 'MachineTechParams',
              localField: 'techParam',
              foreignField: '_id',
              as: 'techParam'
            }
          },
          {
            $unwind: '$techParam'
          },
          {
            $match: {
              'techParam.code': {
                $in: techParamCodes.map(tp => tp.code)
              }
            }
          }
        ],
        as: 'techParamValues'
      }
    },
    {
      $project: {
        serialNo: 1,
        machineId: '$_id',
        machineModel: {
          _id: '$machineModel._id',
          name: '$machineModel.name'
        },
        customer: {
          _id: '$customer._id',
          name: '$customer.name'
        },
        techParamValues: {
          $map: {
            input: '$techParamValues',
            as: 'tpv',
            in: {
              code: '$$tpv.techParam.code',
              value: '$$tpv.techParamValue'
            }
          }
        }
      }
    },
  ];

  const params = {};

  this.dbservice.getObjectListWithAggregate(Product, aggregatePipeline, params, (error, results) => {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      const formattedData = results.map(machine => ({
        'Serial Number': machine.serialNo,
        'Machine Model': machine.machineModel.name,
        'Customer': machine.customer.name,
        ...techParamCodes.reduce((acc, param) => ({
          ...acc,
          [param.display]: machine.techParamValues.find(tpv => 
            tpv.code.includes(param.code)
          )?.value || ''
        }), {})
      }));

      res.json(formattedData);
    }
  });
};

// exports.getProductTechParamReport = async (req, res, next) => {
//   try {
//     const TECH_PARAMS_CONFIG = [
//       { code: "HLCSoftwareVersion", displayName: "HLC Software Version" },
//       { code: "PLCSWVersion", displayName: "PLC Software Version" },
//     ];

//     const listFields = "serialNo machineModel customer status";
//     const listPopulate = [
//       { path: "status", select: "name" },
//       { path: "machineModel", select: "name" },
//       { path: "customer", select: "name" },
//     ];

//     this.query = {
//       "status.name": {
//         $nin: ["Transferred", "Decommissioned"],
//       },
//     };

//     this.orderBy = { serialNo: 1 };

//     this.dbservice.getObjectList(req, Product, listFields, this.query, this.orderBy, listPopulate, callbackFunc);
//     async function callbackFunc(error, paginatedMachines) {
//       if (error) {
//         logger.error(new Error(error));
//         res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
//       } else {
//         const techParams = await ProductTechParam.find({
//           code: { $in: TECH_PARAMS_CONFIG.map((config) => config.code) },
//         }).lean();

//         const paramValues = await ProductTechParamValue.find({
//           machine: { $in: paginatedMachines.data.map(m => m._id) },
//           techParam: { $in: techParams.map(tp => tp._id) }
//         }).lean();

//         const formattedData = paginatedMachines.data.map(machine => {
//           const machineValues = paramValues.filter(pv => 
//             pv.machine.toString() === machine._id.toString()
//           );
  
//           return {
//             serialNo: machine.serialNo,
//             machineModelName: machine.machineModel?.name,
//             customerName: machine.customer?.name,
//             ...TECH_PARAMS_CONFIG.reduce((acc, config) => ({
//               ...acc,
//               [config.displayName]: machineValues.find(mv => 
//                 techParams.find(tp => 
//                   tp._id.toString() === mv.techParam.toString() && 
//                   tp.code.includes(config.code)
//                 )
//               )?.techParamValue || null
//             }), {})
//           };
//         });

//         res.json({
//           currentPage: paginatedMachines.currentPage,
//           pageSize: paginatedMachines.pageSize,
//           totalCount: paginatedMachines.totalCount,
//           totalPages: paginatedMachines.totalPages,
//           data: formattedData
//         });
//       }
//     }
//   } catch (error) {
//     logger.error(new Error(error));
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
//   }
// };
