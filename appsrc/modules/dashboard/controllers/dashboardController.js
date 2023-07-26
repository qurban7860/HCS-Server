const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const { Customer, CustomerSite } = require('../../crm/models');
const { Product, ProductModel } = require('../../products/models');
const { SecurityUser } = require('../../security/models');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')


exports.getData = async (req, res, next) => {

  try{
    let customerCount = await Customer.find({isActive:true, isArchived:false}).countDocuments();
    let nonVerifiedCustomerCount = await Customer.find({isActive:true, isArchived:false,"verifications.0":{$exists:false}}).countDocuments();
    let machineCount = await Product.find({isActive:true, isArchived:false}).countDocuments();
    let nonVerifiedMachineCount = await Product.find({isActive:true, isArchived:false,"verifications.0":{$exists:false}}).countDocuments();
    let userCount = await SecurityUser.find({isActive:true, isArchived:false}).countDocuments();
    let siteCount = await CustomerSite.find({isActive:true, isArchived:false}).countDocuments();
    
    // let countryWiseCustomerCount = await Customer.aggregate([
    //   { $match: { isArchived: false, isActive: true } }, 
    //   { $lookup: { from: "CustomerSites", localField: "mainSite", foreignField: "_id", as: "mainSite" } },
    //   { $unwind: "$mainSite" },
    //   { $match: { "mainSite.address.country": { $nin: ["", null] } } },
    //   { $group: { _id: "$mainSite.address.country", count: { $sum: 1 } } },
    //   { $sort: { count: -1 } },
    //   { $limit: 20 }
    // ]);

    let machineModels = await ProductModel.aggregate([
      { $lookup: { from: "MachineCategories", localField: "category", foreignField: "_id", as: "machineCategory" } },
      { $match: { "machineCategory.connections": true} },
    ]);
    let modelsIds = machineModels.map(m => m._id);
    let connectAbleMachinesCount = await Product.find({machineModel:{$in:modelsIds}}).countDocuments();

    let countryWiseMachineCount = await Product.aggregate([
      { $match: { isArchived: false, isActive: true,  machineModel:{$nin:modelsIds} } }, 
      { $lookup: { from: "CustomerSites", localField: "instalationSite", foreignField: "_id", as: "instalationSite" } },
      { $unwind: "$instalationSite" },
      { $match: { "instalationSite.address.country": { $nin: ["", null] } } },
      { $group: { _id: "$instalationSite.address.country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    let modelWiseMachineCount = await Product.aggregate([
      { $match: { isArchived: false, isActive: true,  machineModel:{$nin:modelsIds} } }, 
      { $lookup: { from: "MachineModels", localField: "machineModel", foreignField: "_id", as: "machineModel" } },
      { $unwind: "$machineModel" },
      { $match: { "machineModel": { $nin: ["", null] } } },
      { $group: { _id: '$machineModel.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    let yearWiseMachines = await Product.aggregate([
      { $match: { installationDate : { $ne:null } } },
      { 
          $group: {
              _id: { year: { $year: "$installationDate" } },
              yearWiseMachines: { $sum: 1 }
          }
      },
      { $sort : { "_id.year" : -1 } }
    ])
    // let countryWiseSiteCount = await CustomerSite.aggregate([
    //   { $match: { isArchived: false, isActive: true, 
    //       "address.country": { $nin: ["", null] } 
    //     }
    //   },
    //   { $group: { _id: "$address.country", count: { $sum: 1 }}}
    // ]);

  res.json({customerCount, 
    nonVerifiedCustomerCount, 
    nonVerifiedMachineCount,
    connectAbleMachinesCount,
    machineCount, 
    userCount, 
    siteCount, 
    modelWiseMachineCount, 
    // countryWiseCustomerCount, 
    // countryWiseSiteCount, 
    countryWiseMachineCount,
    yearWiseMachines
  });

  }catch(e) {
    console.log(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }

};
