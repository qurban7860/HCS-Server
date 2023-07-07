const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const { Customer, CustomerSite } = require('../../crm/models');
const { Product } = require('../../products/models');
const { SecurityUser } = require('../../security/models');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')


exports.getData = async (req, res, next) => {

  try{
    let customerCount = await Customer.find({isActive:true, isArchived:false}).countDocuments();
    let machineCount = await Product.find({isActive:true, isArchived:false}).countDocuments();
    let userCount = await SecurityUser.find({isActive:true, isArchived:false}).countDocuments();
    let siteCount = await CustomerSite.find({isActive:true, isArchived:false}).countDocuments();
    
    let modelWiseMachineCount = await Product.aggregate([
      { $match: { isArchived: false, isActive: true } }, 
      { $lookup: { from: "MachineModels", localField: "machineModel", foreignField: "_id", as: "machineModel" } },
      { $unwind: "$machineModel" },
      { $match: { "machineModel": { $nin: ["", null] } } },
      { $group: { _id: '$machineModel.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
    
    let countryWiseCustomerCount = await Customer.aggregate([
      { $match: { isArchived: false, isActive: true } }, 
      { $lookup: { from: "CustomerSites", localField: "mainSite", foreignField: "_id", as: "mainSite" } },
      { $unwind: "$mainSite" },
      { $match: { "mainSite.address.country": { $nin: ["", null] } } },
      { $group: { _id: "$mainSite.address.country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    let countryWiseMachineCount = await Product.aggregate([
      { $match: { isArchived: false, isActive: true } }, 
      { $lookup: { from: "CustomerSites", localField: "instalationSite", foreignField: "_id", as: "instalationSite" } },
      { $unwind: "$instalationSite" },
      { $match: { "instalationSite.address.country": { $nin: ["", null] } } },
      { $group: { _id: "$instalationSite.address.country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    let countryWiseSiteCount = await CustomerSite.aggregate([
      { $match: { isArchived: false, isActive: true, 
          "address.country": { $nin: ["", null] } 
        }
      },
      { $group: { _id: "$address.country", count: { $sum: 1 }}}
    ]);

  res.json({customerCount, machineCount, userCount, siteCount, modelWiseMachineCount, countryWiseCustomerCount, countryWiseSiteCount, countryWiseMachineCount});

  }catch(e) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }

};
