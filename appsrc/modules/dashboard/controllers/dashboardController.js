const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const { Customer, CustomerSite } = require('../../crm/models');
const { Product, ProductModel } = require('../../products/models');
const { SecurityUser } = require('../../security/models');
const { Country } = require('../../config/models');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')


exports.getMachineByCountries = async (req, res, next) => {

  // console.log(req.query)
  let modelsIds = []
  let installationSitesId = []
  let matchQuery = { isArchived: false, isActive: true };


  if(mongoose.Types.ObjectId.isValid(req.query.model)) {
    
    modelsIds.push(req.query.model);
    matchQuery.machineModel = mongoose.Types.ObjectId(req.query.model);

  } else if(Array.isArray(req.query.model) && req.query.model.length>0) {
    for(let machineModel of req.query.model) {
      if(mongoose.Types.ObjectId.isValid(machineModel))
        modelsIds.push(machineModel);
    }
    matchQuery.machineModel = { $in : modelsIds };

  }
  else {

    let machineModels = await ProductModel.aggregate([
      { $lookup: { from: "MachineCategories", localField: "category", foreignField: "_id", as: "machineCategory" } },
      { $match: { "machineCategory.connections": {$ne:true}} },
    ]);
    modelsIds = machineModels.map(m => m._id);
    matchQuery.machineModel = { $in : modelsIds };
  }

  if(mongoose.Types.ObjectId.isValid(req.query.category)) {
    if(mongoose.Types.ObjectId.isValid(matchQuery.machineModel)) {
      let machineModel = await ProductModel.find({category:req.query.category , _id : matchQuery.machineModel } );
      if(!machineModel) {
        delete matchQuery.machineModel;
      }
    }
    else if(matchQuery.machineModel && matchQuery.machineModel['$in']) {
      let machineModels = await ProductModel.find({category:req.query.category , _id : { $in : matchQuery.machineModel['$in'] } } );
      modelsIds = machineModels.map(m => m._id);
      matchQuery.machineModel = { $in : modelsIds };
    }
    
  }

  req.query.year = parseInt(req.query.year);
  if(!isNaN(req.query.year)) {
    const fromDate = new Date();
    fromDate.setFullYear(req.query.year, 0, 1);
    const toDate = new Date();
    toDate.setFullYear(req.query.year, 11, 31);
    matchQuery.installationDate = { $gte:fromDate, $lte:toDate}
  }
  // console.log(matchQuery);
  let countryWiseMachineCount = await Product.aggregate([
      { $match: matchQuery }, 
      { $lookup: { from: "CustomerSites", localField: "instalationSite", foreignField: "_id", as: "instalationSite" } },
      { $unwind: "$instalationSite" },
      { $match: { "instalationSite.address.country": { $nin: ["", null] } } },
      { $group: { _id: "$instalationSite.address.country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
  return res.json({ 
    countryWiseMachineCount,
  });

};


exports.getMachineByModels = async (req, res, next) => {

  // console.log(req.query)
  let machineModels = await ProductModel.aggregate([
    { $lookup: { from: "MachineCategories", localField: "category", foreignField: "_id", as: "machineCategory" } },
    { $match: { "machineCategory.connections": {$ne:true}} },
  ]);
  let modelsIds = machineModels.map(m => m._id);

  let matchQuery = { isArchived: false, isActive: true, machineModel:{$in:modelsIds} };

  if(mongoose.Types.ObjectId.isValid(req.query.category)) {
    if(mongoose.Types.ObjectId.isValid(matchQuery.machineModel)) {
      let machineModel = await ProductModel.find({category:req.query.category , _id : matchQuery.machineModel } );
      if(!machineModel) {
        delete matchQuery.machineModel;
      }
    }
    else if(matchQuery.machineModel && matchQuery.machineModel['$in']) {
      let machineModels = await ProductModel.find({category:req.query.category , _id : { $in : matchQuery.machineModel['$in'] } } );
      modelsIds = machineModels.map(m => m._id);
      matchQuery.machineModel = { $in : modelsIds };
    }
    
  }

  if(Array.isArray(req.query.country) && req.query.country.length>0) {
    let countries = await Country.find( { country_code : { $in : req.query.country } } );
    let countriesNames = countries.map(c => c.country_name);
    let sites = await CustomerSite.find({'address.country':{$in:countriesNames}},{_id:1});
    installationSitesId = sites.map(s => s._id);
    matchQuery.instalationSite = { $in : installationSitesId };
  }
  else if(req.query.country && typeof req.query.country == 'string' && 
    req.query.country.length<=3) {
    let country = await Country.findOne({country_code:req.query.country});
    if(country) {
      let sites = await CustomerSite.find({'address.country':country.country_name},{_id:1});
      installationSitesId = sites.map(s => s._id);
      matchQuery.instalationSite = { $in : installationSitesId };
    }
  }  
  else {
    
  }

  if(!isNaN(req.query.year)) {
    const fromDate = new Date();
    fromDate.setFullYear(req.query.year, 0, 1);
    const toDate = new Date();
    toDate.setFullYear(req.query.year, 11, 31);
    matchQuery.installationDate = { $gte:fromDate, $lte:toDate}
  }

  // console.log(matchQuery);

  let modelWiseMachineCount = await Product.aggregate([
    { $match: matchQuery }, 
    { $lookup: { from: "MachineModels", localField: "machineModel", foreignField: "_id", as: "machineModel" } },
    { $unwind: "$machineModel" },
    { $match: { "machineModel": { $nin: ["", null] } } },
    { $group: { _id: '$machineModel.name', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);

  return res.json({ 
    modelWiseMachineCount,
  });

};


exports.getMachineByYears = async (req, res, next) => {

  // console.log(req.query)
  let modelsIds = []

  let matchQuery = { isArchived: false, isActive: true, installationDate : { $ne:null } } ;

  if(mongoose.Types.ObjectId.isValid(req.query.model)) {
    
    modelsIds.push(req.query.model);
    matchQuery.machineModel = mongoose.Types.ObjectId(req.query.model);

  } else if(Array.isArray(req.query.model) && req.query.model.length>0) {
    for(let machineModel of req.query.model) {
      if(mongoose.Types.ObjectId.isValid(machineModel))
        modelsIds.push(machineModel);
    }
    matchQuery.machineModel = { $in : modelsIds };

  }
  else {

  }


  if(mongoose.Types.ObjectId.isValid(req.query.category)) {
    if(mongoose.Types.ObjectId.isValid(matchQuery.machineModel)) {
      let machineModel = await ProductModel.find({category:req.query.category , _id : matchQuery.machineModel } );
      if(!machineModel) {
        delete matchQuery.machineModel;
      }
    }
    else if(matchQuery.machineModel && matchQuery.machineModel['$in']) {
      let machineModels = await ProductModel.find({category:req.query.category , _id : { $in : matchQuery.machineModel['$in'] } } );
      modelsIds = machineModels.map(m => m._id);
      matchQuery.machineModel = { $in : modelsIds };
    }
    else {
      let machineModels = await ProductModel.find({category:req.query.category } );
      modelsIds = machineModels.map(m => m._id);
      matchQuery.machineModel = { $in : modelsIds }; 
    }
    
  }


  if(Array.isArray(req.query.country) && req.query.country.length>0) {
    let countries = await Country.find( { country_code : { $in : req.query.country } } );
    let countriesNames = countries.map(c => c.country_name);
    let sites = await CustomerSite.find({'address.country':{$in:countriesNames}},{_id:1});
    installationSitesId = sites.map(s => s._id);
    matchQuery.instalationSite = { $in : installationSitesId };
  }
  else if(req.query.country && typeof req.query.country == 'string' && 
    req.query.country.length<=3) {
    let country = await Country.findOne({country_code:req.query.country});
    if(country) {
      let sites = await CustomerSite.find({'address.country':country.country_name},{_id:1});
      installationSitesId = sites.map(s => s._id);
      matchQuery.instalationSite = { $in : installationSitesId };
    }
  }  

  // console.log(matchQuery);

  let yearWiseMachines = await Product.aggregate([
    { $match : matchQuery },
    { 
        $group: {
            _id: { year: { $year: "$installationDate" } },
            yearWiseMachines: { $sum: 1 }
        }
    },
    { $sort : { "_id.year" : -1 } }
  ]);

  return res.json({ 
    yearWiseMachines,
  });

};

exports.getCount = async (req, res, next) => {

  try{
    let customerCount = await Customer.find({isActive:true, isArchived:false}).countDocuments();
    let nonVerifiedCustomerCount = await Customer.find({isActive:true, isArchived:false,"verifications.0":{$exists:false}}).countDocuments();
    let machineCount = await Product.find({isActive:true, isArchived:false}).countDocuments();
    let nonVerifiedMachineCount = await Product.find({isActive:true, isArchived:false,"verifications.0":{$exists:false}}).countDocuments();
    let userCount = await SecurityUser.find({isActive:true, isArchived:false}).countDocuments();
    let siteCount = await CustomerSite.find({isActive:true, isArchived:false}).countDocuments();
    
    
    let machineModels = await ProductModel.aggregate([
      { $lookup: { from: "MachineCategories", localField: "category", foreignField: "_id", as: "machineCategory" } },
      { $match: { "machineCategory.connections": true} },
    ]);
    let modelsIds = machineModels.map(m => m._id);
    let connectAbleMachinesCount = await Product.find({machineModel:{$in:modelsIds}}).countDocuments();

    

  res.json({customerCount, 
    nonVerifiedCustomerCount, 
    nonVerifiedMachineCount,
    connectAbleMachinesCount,
    machineCount, 
    userCount, 
    siteCount, 
  });

  }catch(e) {
    console.log(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }

};




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
