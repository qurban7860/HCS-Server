const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const _ = require('lodash');

const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let productDBService = require('../service/productDBService')
const dbservice = new productDBService();

const { Product, ProductCategory, ProductModel, ProductConnection, ProductStatus, ProductAuditLog } = require('../models');
const { connectMachines, disconnectMachine_ } = require('./productConnectionController');
const { postProductAuditLog, patchProductAuditLog } =  require('./productAuditLogController');
const { Customer, CustomerSite } = require('../../crm/models')
const { SecurityUser } = require('../../security/models')
const { Region } = require('../../regions/models')
const { Country } = require('../../config/models')
const ObjectId = require('mongoose').Types.ObjectId;

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };  
//this.populate = 'category';
this.populate = [
      {path: 'machineModel', select: '_id name category', 
        populate: { path:"category" , select:"name description connections" }
      },
      {path: 'parentMachine', select: '_id name serialNo supplier machineModel'},
      {path: 'supplier', select: '_id name'},
      {path: 'status', select: '_id name slug'},
      {path: 'customer', select: '_id name'},
      {path: 'billingSite', select: ''},
      {path: 'instalationSite', select: ''},
      {path: 'accountManager', select: '_id firstName lastName'},
      {path: 'projectManager', select: '_id firstName lastName'},
      {path: 'supportManager', select: '_id firstName lastName'},
      {path: 'createdBy', select: 'name'},
      {path: 'updatedBy', select: 'name'}
    ];


exports.getProduct = async (req, res, next) => {
  dbservice.getObjectById(Product, this.fields, req.params.id, this.populate, callbackFunc);
  async function callbackFunc(error, machine) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {

      if(machine && Array.isArray(machine.machineConnections) && machine.machineConnections.length>0) {
        let query_ = { _id : { $in:machine.machineConnections }, isActive : true, isArchived : false };
        let populate = {path: 'connectedMachine', select: '_id name serialNo'}
        machine = JSON.parse(JSON.stringify(machine));


        let machineConnections = await dbservice.getObjectList(ProductConnection,this.fields, query_, {}, populate);
        if(Array.isArray(machineConnections) && machineConnections.length>0) {
          machineConnections = JSON.parse(JSON.stringify(machineConnections));
          let index = 0;
          for(let machineConnection of machineConnections) {
            if(machineConnection && machineConnection.connectedMachine) {
              machineConnections[index].name = machineConnection.connectedMachine.name;
            }
            index++

          }
         
          machine.machineConnections = machineConnections;
        }
        else {
          machine.machineConnections = []; 
        }
      }

      if(Array.isArray(machine.verifications) && machine.verifications.length>0 ) {
        machine = JSON.parse(JSON.stringify(machine));
        let machineVerifications = [];

        for(let verification of machine.verifications) {
          let user = await SecurityUser.findOne({ _id: verification.verifiedBy, isActive: true, isArchived: false }).select('name');
          
          if(user) {
            verification.verifiedBy = user;
            machineVerifications.push(verification);
          }

        }
        machine.verifications = machineVerifications;
      }

      res.json(machine);
    }
  }

};

exports.getProducts = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};  
  this.orderBy = { serialNo: 1,  name: 1};
  
  if(this.query.orderBy) {
    this.orderBy = this.query.orderBy;
    delete this.query.orderBy;
  }
  if(this.query.customerArr){
    const customerIds = JSON.parse(this.query.customerArr);
    this.query.customer = { $in: customerIds };
    delete this.query.customerArr;
  }

  if(!this.query.unfiltered){
    let user = await SecurityUser.findById(req.body.loginUser.userId).select('regions customers machines').lean();
    if(user) {
      let finalQuery = {
        $or: []
      };
      if(Array.isArray(user.regions) && user.regions.length>0 ) {
        let regions = await Region.find({_id:{$in:user.regions}}).select('countries').lean();
        let countries = [];
        let countryNames = [];
        let customerSites = [];
        for(let region of regions) {
          if(Array.isArray(region.countries) && region.countries.length>0)
            countries = [...region.countries];
        }
        
        if(Array.isArray(countries) && countries.length>0) {
          let countriesDB = await Country.find({_id:{$in:countries}}).select('country_name').lean();
          
          if(Array.isArray(countriesDB) && countriesDB.length>0)
            countryNames = countriesDB.map((c)=>c.country_name);
        
        }
        
        if(Array.isArray(countryNames) && countryNames.length>0) {
          customerSitesDB = await CustomerSite.find({"address.country":{$in:countryNames}}).select('_id').lean();
          
          if(Array.isArray(customerSitesDB) && customerSitesDB.length>0) 
            customerSites = customerSitesDB.map((site)=>site._id);
        
        }

        let installationSiteQuery = {$in:customerSites};
        finalQuery.$or.push({ instalationSite: installationSiteQuery});
      
        if(Array.isArray(customerSites) && customerSites.length>0){
          let customers = await Customer.find({"mainSite": {$in: customerSites}}).lean();
          if(Array.isArray(customers) && customers.length>0){
            let customerIDs = customers.map((customer) => customer._id);
            finalQuery.$or.push({ customer: customerIDs});
          }
        }
      }

      if(Array.isArray(user.machines) && user.machines.length>0) {
        let idQuery = {$in:user.machines}
        finalQuery.$or.push({ _id: idQuery});
      }

      if(Array.isArray(user.customers) && user.customers.length>0) {
        let customerQuery = {$in:user.customers}
        finalQuery.$or.push({ customer: customerQuery});
      }

      if(finalQuery.$or.length > 0){
        this.query = {
          ...this.query,
          ...finalQuery
        }
      }
    }
  }else{
    delete this.query.unfiltered;
  }


  dbservice.getObjectList(Product, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  function callbackFunc(error, products) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      if(req.query.getConnectedMachine) {
        let index = 0;
        let filteredProducts = [];
        for(let product of products) {

          if(product && product.machineModel && product.machineModel.category && 
            product.machineModel.category.connections) {
            filteredProducts.push(product);
          }

        }
        res.json(filteredProducts);

      }
      else {
        res.json(products);
      }
    }
  }
};

exports.getConnectionProducts = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};  
  aggregateQuery = [
    {
      $lookup: {
        from: 'MachineModels',
        localField: 'machineModel',
        foreignField: '_id',
        as: 'model'
      }
    },
    {
      $unwind: '$model'
    },
    {
      $lookup: {
        from: 'MachineCategories',
        localField: 'model.category',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $unwind: '$category'
    },
    {
      $match: {
        'category.connections': true,
        'customer': ObjectId(this.query.customer),
          'isActive': true,
          'isArchived': false
      }
    }
  ];
  let listProducts = await Product.aggregate(aggregateQuery);
  res.status(StatusCodes.OK).json(listProducts);
};


exports.getMachinesAgainstCountries = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {}; 
  let targetCountries = [];

  if(this.query.countries) {
    targetCountries = JSON.parse(this.query.countries);
  }
  const aggregate = [
    {
      $match: {
        instalationSite: { $exists: true },
        isActive: true,
        isArchived: false,
      }
    },
    {
      $lookup: {
        from: "CustomerSites",
        localField: "instalationSite",
        foreignField: "_id",
        as: "installationSiteData"
      }
    },
    {
      $match: {
        "installationSiteData.address.country": { $in: targetCountries }
      }
    }
  ];
  const params = {};

  dbservice.getObjectListWithAggregate(Product, aggregate, params, callbackFunc);
  function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.json(response);
    }
  }
};

exports.deleteProduct = async (req, res, next) => {
  dbservice.deleteObject(Product, req.params.id, res, callbackFunc);
  //console.log(req.params.id);
  async function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      const machine = { _id: req.params.id };
      let machineAuditLog = createMachineAuditLogRequest(machine, 'Delete', req.body.loginUser.userId)
      await postProductAuditLog(machineAuditLog);
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postProduct = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("errors machine patch request",errors);
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    let machineConnections = req.body.machineConnections;
    req.body.machineConnections = [];
    dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
    async function callbackFunc(error, machine) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error._message
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        let machineAuditLog = createMachineAuditLogRequest(machine, 'Create', req.body.loginUser.userId)
        await postProductAuditLog(machineAuditLog);

        if(machine && Array.isArray(machineConnections) && machineConnections.length>0) 
          machine = await connectMachines(machine.id, machineConnections);
        
        res.status(StatusCodes.CREATED).json({ Machine: machine });
      }
    }
  }
};

exports.patchProduct = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("errors machine patch request",errors);
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    let machine = await dbservice.getObjectById(Product, this.fields, req.params.id, this.populate);
    if(machine.status?.slug && machine.status.slug === 'transferred'){
      if(!("isVerified" in req.body)){
        return res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordCustomMessageJSON(StatusCodes.FORBIDDEN, 'Transferred machine cannot be edited'));
      }
    }

    if(machine && req.body.isVerified){ 
      
      if(!Array.isArray(machine.verifications))
        machine.verifications = [];

      for(let verif of machine.verifications) {
        if(verif.verifiedBy == req.body.loginUser.userId)
          return res.status(StatusCodes.BAD_REQUEST).json({message:"Already verified"});

      }
      machine.verifications.push({
        verifiedBy: req.body.loginUser.userId,
        verifiedDate: new Date()
      })
      machine = await machine.save();
      return res.status(StatusCodes.ACCEPTED).json(machine);
    }



    if(machine && "updateTransferStatus" in req.body && req.body.updateTransferStatus){ 
      let queryString = { slug: 'intransfer'}
      let machineStatus = await dbservice.getObject(ProductStatus, queryString, this.populate);
      if(machineStatus){
        req.body.status = machineStatus._id;
      }
    }
    else{ 
      if(machine && Array.isArray(machine.machineConnections) && 
        Array.isArray(req.body.machineConnections)) {
        
        let oldMachineConnections = machine.machineConnections;
        let newMachineConnections = req.body.machineConnections;
        let isSame = _.isEqual(oldMachineConnections.sort(), newMachineConnections.sort());

        if(!isSame) {
          let toBeConnected = newMachineConnections.filter(x => !oldMachineConnections.includes(x));
          
          if(toBeConnected.length>0) 
            machine = await connectMachines(machine.id, toBeConnected);
          

          let toBeDisconnected = oldMachineConnections.filter(x => !newMachineConnections.includes(x.toString()));

          if(toBeDisconnected.length>0) 
            machine = await disconnectMachine_(machine.id, toBeDisconnected);
          
          req.body.machineConnections = machine.machineConnections;

        }
      }
      // else {
      //   console.log("machine patch request machine connections provided but empty");

      //   return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
      // }
    }
  
    
    
    dbservice.patchObject(Product, req.params.id, getDocumentFromReq(req), callbackFunc);
    async function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error._message
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
        let machineAuditLog = createMachineAuditLogRequest(machine, 'Update', req.body.loginUser.userId);
        await postProductAuditLog(machineAuditLog);
        res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED, result));
      }
    }
  }
};

exports.transferOwnership = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      if (ObjectId.isValid(req.body.machine)) {
        // validate if machine is already in-transfer or not
        let parentMachine = await dbservice.getObjectById(Product, this.fields, req.body.machine, {path: 'status', select: ''});
        if (!parentMachine) {
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordMissingParamsMessage(StatusCodes.BAD_REQUEST, 'Product'));
        }

        // validate if the machine has a valid status
        if(!(parentMachine.customer)){
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Machine without a customer cannot be transferred'));
        }

        if(isNonTransferrableMachine(parentMachine.status)){
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Machine status invalid for transfer'));
        } 

        if(!parentMachine.isActive || parentMachine.isArchived){
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Inactive or archived machines cannot be transferred'));
        }
        // validate if an entry already exists with the same customer and parentMachineID
        let alreadyTransferredParentMachine = await dbservice.getObject(Product, { customer: req.body.customerId, parentMachineID: req.body.machine, isActive: true, isArchived: false }, this.populate);
        if(alreadyTransferredParentMachine){
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordDuplicateRecordMessage(StatusCodes.BAD_REQUEST));          
        }

        if (parentMachine) {
          
          req.body.serialNo = parentMachine.serialNo;
          req.body.machineModel = parentMachine.machineModel;
          req.body.parentMachine = parentMachine.parentMachine;
          req.body.parentSerialNo = parentMachine.parentSerialNo;
          req.body.parentMachineID = parentMachine._id;
          
          if(parentMachine.machineConnections.length > 0){
            let disconnectConnectedMachines = await disconnectMachine_(parentMachine.id, parentMachine.machineConnections);
          }
            
          // update status of the new(transferred) machine
          let queryString = { slug: 'intransfer'}
          let machineStatus = await dbservice.getObject(ProductStatus, queryString, this.populate);
          if(machineStatus){
            req.body.status = machineStatus._id;
          }
          
          queryString = { slug: 'transferred'}
          let parentMachineStatus = await dbservice.getObject(ProductStatus, queryString, this.populate);
          if (!parentMachineStatus) {
            return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordMissingParamsMessage(StatusCodes.BAD_REQUEST, this.ProductStatus));
          } else {
            const transferredMachine = await dbservice.postObject(getDocumentFromReq(req, 'new'));
            if (transferredMachine) {
              // update old machine ownsership status
              let parentMachineUpdated = await dbservice.patchObject(Product, req.body.machine, {
                transferredMachine: transferredMachine._id,
                transferredDate: new Date(),
                isActive: false,
                status: parentMachineStatus._id
              });
              if(parentMachineUpdated){
                let machineAuditLog = createMachineAuditLogRequest(parentMachine, 'Transfer', req.body.loginUser.userId);
                await postProductAuditLog(machineAuditLog);
                res.status(StatusCodes.CREATED).json({ Machine: transferredMachine });
              }
            }
          }
        }
      } else {
        return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordInvalidParamsMessage(StatusCodes.BAD_REQUEST));
      }
    }
    catch (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
    }
  }
};

function isNonTransferrableMachine(status) {
  if (!_.isEmpty(status) && status.slug === 'transferred') {
    return true;
  }
  return false;
}

function createMachineAuditLogRequest(machine, activityType, loggedInUser) {
  let machineAuditLog = {
    body: JSON.parse(JSON.stringify(machine))
  };
  machineAuditLog.body.machine = machine._id;
  machineAuditLog.body.activityType = activityType;
  if(activityType == 'Transfer'){
    machineAuditLog.body.activitySummary = `Machine(ID:${machine._id}) owned by customer(ID:${machine.customer}) transferred by user(ID:${loggedInUser})`;
    machineAuditLog.body.activityDetail = `Machine(ID:${machine._id}) owned by customer(ID:${machine.customer}) transferred by user(ID:${loggedInUser})`;
  } else {
    machineAuditLog.body.activitySummary = `Machine(ID:${machine._id}) ${activityType} by user(ID:${loggedInUser})`;
    machineAuditLog.body.activityDetail = `Machine(ID:${machine._id}) ${activityType} by user(ID:${loggedInUser})`;
  }

  return machineAuditLog;
}

exports.getProductsSiteCoordinates = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  
  var installationSiteAggregate = ([
    {
      $match: {
        instalationSite: { $ne: null },
        isActive: true,
        isArchived: false,
      }
    },
    {
      $lookup: {
        from: "CustomerSites",
        let: { installationSite: "$instalationSite" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$_id", "$$installationSite"] },
                  { $ne: ["$lat", null] },
                  { $ne: ["$long", null] },
                  { $ne: ["$lat", ""] },
                  { $ne: ["$long", ""] }
                ]
              }
            }
          }
        ],
        as: "installationSiteInfo"
      }
    },
    {
      $lookup: {
        from: "Customers",
        localField: "customer",
        foreignField: "_id",
        as: "customerInfo"
      }
    },
    {
      $match: {
        $and: [
          { "installationSiteInfo": { $ne: [] } },
        ]
      }
    },
    {
      $project: {
        name: 1, 
        instalationSite: 1,
        serialNo: 1,
        lat: { $arrayElemAt: ["$installationSiteInfo.lat", 0] },
        lng: { $arrayElemAt: ["$installationSiteInfo.long", 0] },
        address: { $arrayElemAt: ["$installationSiteInfo.address", 0] },
        customerName: { $arrayElemAt: ["$customerInfo.name", 0] },
      }
    },

  ])

  var params = {};
  
  let machineInstallationSiteCoordiantes = await dbservice.getObjectListWithAggregate(Product, installationSiteAggregate, params);

  const convertedArray = machineInstallationSiteCoordiantes.map(obj => ({
    ...obj,
    lat: parseFloat(obj.lat),
    lng: parseFloat(obj.lng)
  }));

  res.status(StatusCodes.OK).json(convertedArray);
};

// exports.transferOwnership = async (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
//   } else {
//     try {
//       if (ObjectId.isValid(req.body.machine) && ObjectId.isValid(req.body.customer)) {
//         // validate if an entry already exists with the same customer and parentMachineID
//         let existingParentMachine = await Product.findOne({ customer: req.body.customer, parentMachineID: req.body.machine, isActive: true, isArchived: false });
//         if(existingParentMachine){
//           return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordDuplicateRecordMessage(StatusCodes.BAD_REQUEST));          
//         }
        
//         let existingMachine = await Product.findOne({ customer: req.body.customer, _id: req.body.machine, isActive: true, isArchived: false});
//         if(existingMachine){
//           return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Machine cannot be transferred to the same customer', true));          
//         }

//         let customer = await Customer.findById(req.body.customer);
//         let parentMachine = await Product.findById(req.body.machine);

//         if (!customer) {
//           return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordMissingParamsMessage(StatusCodes.BAD_REQUEST, Customer));
//         }
//         if (!parentMachine) {
//           return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordMissingParamsMessage(StatusCodes.BAD_REQUEST, Product));
//         }

//         if (parentMachine && customer) {
          
//           req.body.serialNo = parentMachine.serialNo;
//           req.body.machineModel = parentMachine.machineModel;
//           req.body.parentMachine = parentMachine.parentMachine;
//           req.body.parentSerialNo = parentMachine.parentSerialNo;
//           req.body.parentMachineID = parentMachine._id;
//           req.body.machineConnections = parentMachine.machineConnections;

//           // if (customer.mainSite) {
//           //   req.body.instalationSite = customer.mainSite;
//           //   req.body.billingSite = customer.mainSite;
//           // }

//           let status = await ProductStatus.findOne({ name: { $regex: /sold\/transferred/i } });
//           if (!status) {
//             return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordMissingParamsMessage(StatusCodes.BAD_REQUEST, this.ProductStatus));
//           } else {
//             const transferredMachine = await dbservice.postObject(getDocumentFromReq(req, 'new'));
//             if (transferredMachine) {
//               // update old machine ownsership status
//               let parentMachineUpdated = await dbservice.patchObject(Product, req.body.machine, {
//                 transferredMachine: transferredMachine._id,
//                 transferredDate: new Date(),
//                 isActive: false,
//                 status: status._id
//               });
//               if(parentMachineUpdated){
//                 res.status(StatusCodes.CREATED).json({ Machine: transferredMachine });
//               }
//             }
//           }
//         }
//       } else {
//         return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordInvalidParamsMessage(StatusCodes.BAD_REQUEST));
//       }
//     }
//     catch (error) {
//       logger.error(new Error(error));
//       res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error._message);
//     }
//   }
// };



function getDocumentFromReq(req, reqType){
  const { serialNo, name, parentMachine, parentSerialNo, status, supplier, machineModel, 
    workOrderRef, customer, instalationSite, billingSite, operators,
    accountManager, projectManager, supportManager, license, logo, siteMilestone,
    tools, description, internalTags, customerTags, installationDate, shippingDate,
    isActive, isArchived, loginUser, machineConnections, parentMachineID, alias } = req.body;
 
  
    let doc = {};
  if (reqType && reqType == "new"){
    doc = new Product({});
  }
  
  if ("serialNo" in req.body){
    doc.serialNo = serialNo;
  }
  if ("name" in req.body){
    doc.name = name;
  }
  if ("parentMachine" in req.body){
    doc.parentMachine = parentMachine;
  }
  if ("parentMachineID" in req.body){
    doc.parentMachineID = parentMachineID;
  }
  if ("parentSerialNo" in req.body){
    doc.parentSerialNo =  parentSerialNo;
  }
  if ("status" in req.body){
    doc.status = status;
  }
  if ("supplier" in req.body){
    doc.supplier = supplier;
  }
  if ("machineModel" in req.body){
    doc.machineModel = machineModel;
  }
  if ("workOrderRef" in req.body){
    doc.workOrderRef = workOrderRef;
  }
  if ("customer" in req.body){
    doc.customer = customer;
  }
  if ("machineConnections" in req.body){
    doc.machineConnections = machineConnections;
  }
  if ("instalationSite" in req.body){
    doc.instalationSite = instalationSite;
  }
  if ("billingSite" in req.body){
    doc.billingSite = billingSite;
  }
  if ("installationDate" in req.body){
    doc.installationDate = installationDate;
  }
  if ("shippingDate" in req.body){
    doc.shippingDate = shippingDate;
  }
  if ("operators" in req.body){
    doc.operators = operators;
  }
  if ("accountManager" in req.body){
    doc.accountManager = accountManager;
  }
  if ("projectManager" in req.body){
    doc.projectManager = projectManager;
  }
  if ("supportManager" in req.body){
    doc.supportManager = supportManager;
  }
  if ("alias" in req.body){
    doc.alias = alias;
  }


  if ("license" in req.body){
    doc.license = license;
  }
  if ("logo" in req.body){
    doc.logo = logo;
  }
  if ("tools" in req.body){
    doc.tools = tools;
  }
  if ("internalTags" in req.body){
    doc.internalTags = internalTags;
  }
  if ("customerTags" in req.body){
    doc.customerTags = customerTags;
  }
  if ("description" in req.body){
    doc.description = description;
  }
  if ("siteMilestone" in req.body){
    doc.siteMilestone = siteMilestone;
  }
  if ("isActive" in req.body){
    doc.isActive = isActive;
  }
  if ("isArchived" in req.body){
    doc.isArchived = isArchived;
  }

  if (reqType == "new" && "loginUser" in req.body ){
    doc.createdBy = loginUser.userId;
    doc.updatedBy = loginUser.userId;
    doc.createdIP = loginUser.userIP;
  } else if ("loginUser" in req.body) {
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
  } 

  //console.log("doc in http req: ", doc);
  return doc;

}
