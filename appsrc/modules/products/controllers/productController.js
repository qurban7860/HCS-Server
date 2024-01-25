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

const { Product, ProductProfile, ProductCategory, ProductModel, ProductConnection, ProductStatus, ProductAuditLog, ProductTechParamValue, ProductToolInstalled, ProductDrawing, ProductServiceRecords, ProductLicense } = require('../models');
const { ProductConfiguration } = require('../../apiclient/models');
const { Document } = require('../../documents/models');
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
this.populate = [
      {path: 'machineModel', select: '_id name category', 
        populate: { path:"category" , select:"name description connections" }
      },
      {path: 'parentMachine', select: '_id name serialNo supplier machineModel'},
      {path: 'supplier', select: '_id name'},
      {path: 'status', select: '_id name slug'},
      {path: 'customer', select: '_id clientCode name'},
      {path: 'billingSite', select: ''},
      {path: 'instalationSite', select: ''},
      {path: 'accountManager', select: '_id firstName lastName'},
      {path: 'projectManager', select: '_id firstName lastName'},
      {path: 'supportManager', select: '_id firstName lastName'},
      {path: 'financialCompany', select: '_id clientCode name'},
      {path: 'transferredMachine', select: '_id serialNo name customer'},
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

      machine = JSON.parse(JSON.stringify(machine));
      
      if(machine && Array.isArray(machine.machineConnections) && machine.machineConnections.length>0) {
        let query_ = { _id : { $in:machine.machineConnections }, isActive : true, isArchived : false };
        let populate = {path: 'connectedMachine', select: '_id name serialNo machine'}
        machine = JSON.parse(JSON.stringify(machine));


        let machineConnections = await dbservice.getObjectList(req, ProductConnection,this.fields, query_, {}, populate);
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

      let machineProfileQuery = {type:"MANUFACTURE", machine: machine._id, isActive:true, isArchived:false};
      machine.machineProfile = await ProductProfile.findOne(machineProfileQuery).select('names defaultName web flange');


      if(machine && machine.parentMachineID) {
        machine.transferredFrom = await Product.findOne({_id: machine.parentMachineID}).select('customer').populate({path: 'customer', select: 'name'});
      }

      if(machine && machine.machineModel && machine.machineModel.category && machine.machineModel.category.connections) {
        let queryString_ = {connectedMachine: machine._id, disconnectionDate: {$exists: false}};
        machine.parentMachines = await ProductConnection.find(queryString_).sort({_id: -1}).select('machine').populate({path: 'machine', select: 'serialNo'});
      }

      if(machine?.transferredMachine?.customer && ObjectId.isValid(machine?.transferredMachine?.customer)){
        let objectCustomer = await Customer.findOne({_id: machine?.transferredMachine?.customer}).select('clientCode name tradingName type').lean();
        machine.transferredMachine.customer = objectCustomer;
      }

      res.json(machine);
    }
  }
};

exports.getProducts = async (req, res, next) => {
  const listPopulate = [
    {path: 'machineModel', select: '_id name category'},
    {path: 'status', select: '_id name slug'},
    {path: 'customer', select: '_id clientCode name'}
  ];

  if(req.query.customer) {
    listPopulate.push({path: 'instalationSite', select: ''});
  }

  const listFields = 'serialNo name model customer installationDate shippingDate verifications status isActive createdAt';

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

  if(!this.query.customer) {
    let listCustomers = await Customer.find({"excludeReports": { $ne: true }}).select('_id').lean();
    let customerIds = listCustomers.map((c)=>c._id); 
    this.query.customer = { $in: customerIds };
  }


  dbservice.getObjectList(req, Product, listFields, this.query, this.orderBy, listPopulate, callbackFunc);
  async function callbackFunc(error, products) {
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
    },
    {
      $sort: {
        serialNo: 1
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

          let toBeDisconnected = oldMachineConnections.filter(x => !newMachineConnections.includes(x.toString()));

          if(toBeDisconnected.length>0) 
            machine = await disconnectMachine_(machine.id, toBeDisconnected);


          let toBeConnected = newMachineConnections.filter(x => !oldMachineConnections.includes(x));
          
          if(toBeConnected.length>0) 
            machine = await connectMachines(machine.id, toBeConnected);
          


          
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
        // console.log("machineAuditLog", machineAuditLog);
        // await postProductAuditLog(machineAuditLog);
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
          if(req.body.installationSite && ObjectId.isValid(req.body.installationSite)) req.body.instalationSite = req.body.installationSite;

          // // Assuming parentMachine.machineConnections and req.body.machineConnections are arrays
          // const parentMachineConnections = parentMachine.machineConnections;
          // const requestBodyConnections = req.body.machineConnections;
          // if(parentMachineConnections && parentMachineConnections.length > 0 && requestBodyConnections && requestBodyConnections.length > 0) {
          //   const filteredConnections = parentMachineConnections.filter(connection => !requestBodyConnections.includes(connection));
          //   parentMachine.machineConnections = filteredConnections;
          // }

          // if(parentMachine.machineConnections && parentMachine.machineConnections.length > 0){
          //   let disconnectConnectedMachines = await disconnectMachine_(parentMachine.id, parentMachine.machineConnections);
          // }
          
          
          if(!req.body.status) {
            // update status of the new(transferred) machine
            let queryString = { slug: 'intransfer'}
            let machineStatus = await dbservice.getObject(ProductStatus, queryString, this.populate);
            if(machineStatus){
              req.body.status = machineStatus._id;
            }
          }
          
          queryString = { slug: 'transferred'}
          let parentMachineStatus = await dbservice.getObject(ProductStatus, queryString, this.populate);
          if (!parentMachineStatus) {
            return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordMissingParamsMessage(StatusCodes.BAD_REQUEST, this.ProductStatus));
          } else {
            const transferredMachine = await dbservice.postObject(getDocumentFromReq(req, 'new'));
            if (transferredMachine) {
              const whereClause = {machine: req.body.machine, isArchived: false, isActive: true};
              const setClause = {machine: transferredMachine._id};
              
              await disconnectConnections(req, transferredMachine._id);
              
              // Step 2 
              if(req.body.isAllSettings && (req.body.isAllSettings == 'true' || req.body.isAllSettings == true)){              
                console.log("req.body.isAllSettings", req.body.isAllSettings);
                const responseProductTechParamValue = await ProductTechParamValue.updateMany(whereClause, setClause);
                console.log("responseProductTechParamValue", responseProductTechParamValue);
              }

              if(req.body.isAllTools && (req.body.isAllTools == 'true' || req.body.isAllTools == true)){              
                console.log("req.body.isAllTools", req.body.isAllTools);
                const responseProductToolInstalled = await ProductToolInstalled.updateMany(whereClause, setClause);
                console.log("responseProductToolInstalled", responseProductToolInstalled);
              }

              if(req.body.isAllDrawings && (req.body.isAllDrawings == 'true' || req.body.isAllDrawings == true)){              
                console.log("req.body.isAllDrawings", req.body.isAllDrawings);
                const responseProductDrawing = await ProductDrawing.updateMany(whereClause, setClause);
                console.log("responseProductDrawing", responseProductDrawing);
              }

              if(req.body.isAllProfiles && (req.body.isAllProfiles == 'true' || req.body.isAllProfiles == true)){              
                console.log("req.body.isAllProfiles", req.body.isAllProfiles);
                const responseProductProfile = await ProductProfile.updateMany(whereClause, setClause);
                console.log("responseProductProfile", responseProductProfile);
              }

              if(req.body.isAllINIs && (req.body.isAllINIs == 'true' || req.body.isAllINIs == true)){              
                console.log("req.body.isAllINIs", req.body.isAllINIs);
                const responseProductConfiguration = await ProductConfiguration.updateMany(whereClause, setClause);
                console.log("responseProductConfiguration", responseProductConfiguration);
              }

              // Step 3 List document for selection to transfer to new machine id
              if(req.body.machineDocuments && req.body.machineDocuments.length > 0) {
                console.log("req.body.machineDocuments", req.body.machineDocuments);
                const responseDocument = await Document.updateMany({_id: {$in: req.body.machineDocuments}}, setClause);
                console.log("responseDocument", responseDocument);
              }

              // Step 4 List of existing connected machines to choose to move with new machine id. 
              if(req.body.machineConnections && req.body.machineConnections.length > 0) {
                console.log("req.body.machineConnections", req.body.machineConnections);
                const responseMachineConnection = await ProductConnection.updateMany({machine: {$in: req.body.machineConnections}}, setClause);
                console.log("responseMachineConnection", responseMachineConnection);
              }

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

const disconnectConnections = async (req, newMachine) => {
  const requestBodyConnections = req.body.machineConnections;
  if(newMachine && ObjectId.isValid(newMachine)){
    try {
      const queryString___ = {
        connectedMachine: { $in: requestBodyConnections },
        disconnectionDate: { $exists: false },
        isActive: true,
        machine: { '$ne': req.body.machine }
      };
      console.log("queryString___", queryString___);
      const machineWithConnections = await ProductConnection
        .find(queryString___)
        .select('machine connectedMachine serialNo')
        .populate([
          { path: 'machine', select: 'serialNo' },
          { path: 'connectedMachine', select: 'serialNo' }
        ]);
  
      if (machineWithConnections.length > 0) {
        for (const connection of machineWithConnections) {
          // console.log("Serial No:", connection.machine.serialNo);
          // console.log("Connections:", connection.connectedMachine.serialNo);
  
          const productObject = await Product
            .findOne({ machineConnections: connection._id })
            .select('_id machineConnections');
  
          if (productObject && productObject.machineConnections.length > 0) {
            connection.machineConnections = productObject.machineConnections
              .filter(item => item.toString() !== connection._id.toString());
  
            const updateValue = { disconnectionDate: new Date(), isActive: false };
            console.log("updating.... ProductConnection", connection._id, updateValue);
            await dbservice.patchObject(ProductConnection, connection._id, updateValue);

            const patchProductObjQuery = { machineConnections: connection.machineConnections, customer: req.body.customer };
            console.log("updating.... Product", productObject._id, patchProductObjQuery);
            await dbservice.patchObject(Product, productObject._id, patchProductObjQuery);
          }
        }
        await Product.updateMany({_id: {$in: requestBodyConnections}}, {$set: {customer: req.body.customer}});



        const queryS = {machine: { '$eq': req.body.machine }, connectedMachine: {'$in': requestBodyConnections}, isActive: true};
        const productConnections = await ProductConnection.find(queryS).select('_id');
        const productConn__ = await ProductConnection.find(queryS).select('_id');
        await ProductConnection.updateMany(queryS, { $set: { machine: newMachine } });
        await dbservice.patchObject(Product, newMachine, { machineConnections: productConn__ });
    
        // // update previous machine.
        const listPreviousMacConn = await ProductConnection.find({machine: req.body.machine}).select('_id');
        await Product.updateMany({_id: req.body.machine}, {$set: {machineConnections: listPreviousMacConn}});
      }



      
    } catch (error) {
      console.error("Error in disconnectConnections:", error.message);
    }
  } else {
    console.log("** invalid new machine id");
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

exports.moveMachine = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      if (ObjectId.isValid(req.body.machine) && ObjectId.isValid(req.body.customer)) {
        // validate if an entry already exists with the same customer and parentMachineID
        
        let existingMachine = await Product.findOne({ customer: req.body.customer, _id: req.body.machine, isActive: true, isArchived: false});
        
        if(existingMachine)
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Machine cannot be transferred to the same customer', true));          
        

        let customer = await Customer.findOne({ _id : req.body.customer, isActive : true, isArchived : false });
        let machine = await Product.findOne({ _id : req.body.machine,isArchived : false, isActive : true });
        
        
        let installationSite;
        let billingSite;

        if (req.body.installationSite !== undefined && ObjectId.isValid(req.body.installationSite)) {
          installationSite = await CustomerSite.findOne({ _id: req.body.installationSite, isArchived: false, isActive: true });
        }

        if (req.body.billingSite !== undefined && ObjectId.isValid(req.body.billingSite)) {
          billingSite = await CustomerSite.findOne({ _id: req.body.billingSite, isArchived: false, isActive: true });
        }


        if (!customer ) 
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordMissingParamsMessage(StatusCodes.BAD_REQUEST, Customer));

          if (req.body.installationSite !== undefined && ObjectId.isValid(req.body.installationSite) && !installationSite) 
            return res.status(StatusCodes.BAD_REQUEST).send("Invalid installation Site");

          if (req.body.billingSite !== undefined && ObjectId.isValid(req.body.billingSite) && !billingSite) 
            return res.status(StatusCodes.BAD_REQUEST).send('Invalid Billing Site');
        
        if (!machine) 
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordMissingParamsMessage(StatusCodes.BAD_REQUEST, Product));
        
        machine.customer = customer._id;
       

          machine.instalationSite = installationSite?._id || null;
        
      
          machine.billingSite = billingSite?._id || null;


        machine = await machine.save();
        return res.status(StatusCodes.OK).json({ Machine: machine });

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

const { Config } = require('../../config/models');
exports.exportProductsJSONforCSV = async (req, res, next) => {
  try {
    this.query = req.query != "undefined" ? req.query : { isActive: true, isArchived: false };
    let sortBy = { createdAt: -1 };

    if (this.query.orderBy) {
      sortBy = this.query.orderBy;
      delete this.query.orderBy;
    }

    const regex = new RegExp("^EXPORT_UUID$", "i");
    let EXPORT_UUID = await Config.findOne({ name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true }).select('value');
    EXPORT_UUID = EXPORT_UUID && EXPORT_UUID.value.trim().toLowerCase() === 'true' ? true : false;

    let products = await Product.find(this.query).populate(this.populate).sort(sortBy);
    products = JSON.parse(JSON.stringify(products));
    let aggregate = [
      { $match: { isArchived: false, isActive: true } },
      { $group: { _id: "$machine", count: { $sum: 1 } } }
    ];
    let listProductTechParamValue = await ProductTechParamValue.aggregate(aggregate);
    let listProductToolInstalled = await ProductToolInstalled.aggregate(aggregate);
    let listProductDrawing = await ProductDrawing.aggregate(aggregate);
    let listProductLicense = await ProductLicense.aggregate(aggregate);
    let listProfileCount = await ProductProfile.aggregate(aggregate);
    let listProductServiceRecords = await ProductServiceRecords.aggregate(aggregate);
    let listProductConfiguration = await ProductConfiguration.aggregate(aggregate);
    let listDocument = await Document.aggregate(aggregate);

    const options = { timeZone: 'Pacific/Auckland', year: 'numeric', month: 'numeric', day: 'numeric' };

    let listObjects = await Promise.all(products.map(async (product) => {
      let countlistProductTechParamValue = listProductTechParamValue.find((obj) => obj?._id?.toString() == product?._id?.toString());
      let countlistProductToolInstalled = listProductToolInstalled.find((obj) => obj?._id?.toString() == product?._id?.toString());
      let countlistProductDrawing = listProductDrawing.find((obj) => obj?._id?.toString() == product?._id?.toString());
      let countlistDocument = listDocument.find((obj) => obj?._id?.toString() == product?._id?.toString());
      let countlistProductLicense = listProductLicense.find((obj) => obj?._id?.toString() == product?._id?.toString());
      let countlistProfileCount = listProfileCount.find((obj) => obj?._id?.toString() == product?._id?.toString());
      let countlistProductServiceRecords = listProductServiceRecords.find((obj) => obj?._id?.toString() == product?._id?.toString());
      let countlistProductConfiguration = listProductConfiguration.find((obj) => obj?._id?.toString() == product?._id?.toString());

      let finalDataObj = null;

      let shippingDateLTZ = ""; 
      if(product?.shippingDate && product?.shippingDate.length > 0) { const shippingDate = new Date(product.shippingDate); shippingDateLTZ = shippingDate.toLocaleString('en-NZ', options); }
      
      let installationDateLTZ = ""; 
      if(product?.installationDate && product?.installationDate.length > 0) { const installationDate = new Date(product.installationDate); installationDateLTZ = installationDate.toLocaleString('en-NZ', options); }
      
      let SupportExpireDateLTZ = ""; 
      if(product?.SupportExpireDate && product?.SupportExpireDate.length > 0) { const SupportExpireDate = new Date(product.SupportExpireDate); SupportExpireDateLTZ = SupportExpireDate.toLocaleString('en-NZ', options); }
      
      console.log(shippingDateLTZ, installationDateLTZ, SupportExpireDateLTZ);

      if (EXPORT_UUID) {



        finalDataObj = {
          ProductID: "" + (product._id) + "",
          SerialNo: `${product?.serialNo.replace(/"/g, "'")}`,
          Name: product?.name === undefined ? "" : (`${product?.name.replace(/"/g, "'")}`),
          MachineModel: product?.machineModel?.name === undefined ? "" : (`${product?.machineModel?.name.replace(/"/g, "'")}`),
          Supplier: product?.supplier?.name === undefined ? "" : (`${product?.supplier?.name?.replace(/"/g, "'")}`),
          Status: product?.status?.name === undefined ? "" : (`${product?.status?.name.replace(/"/g, "'")}`),
          WorkOrderRef: product?.workOrderRef === undefined ? "" : (`${product?.workOrderRef.replace(/"/g, "'")}`),
          FinancialCompany: product?.financialCompany?.name === undefined ? "" : (`${product?.financialCompany?.name.replace(/"/g, "'")}`),
          Customer: product?.customer?.name === undefined ? "" : (`${product?.customer?.name.replace(/"/g, "'")}`),
          InstallationSite: product?.instalationSite?.name === undefined ? "" : (`${product?.instalationSite?.name.replace(/"/g, "'")}`),
          InstallationSiteAddress: `${(fetchAddressCSV(product?.instalationSite?.address).replace(/"/g, "'"))}`,
          InstallationSiteLatitude: product?.instalationSite?.long === undefined ? "" : `${(product?.instalationSite?.long.replace(/"/g, "'"))}`,
          InstallationSiteLongitude: product?.instalationSite?.long === undefined ? "" : `${(product?.instalationSite?.long.replace(/"/g, "'"))}`,
          BillingSite: product?.billingSite?.name === undefined ? "" : `${(product?.billingSite?.name.replace(/"/g, "'"))}`,
          BillingSiteAddress: `${(fetchAddressCSV(product?.billingSite?.address).replace(/"/g, "'"))}`,
          BillingSiteLatitude: product?.billingSite?.long === undefined ? "" : `${(product?.billingSite?.long.replace(/"/g, "'"))}`,
          BillingSiteLongitude: product?.billingSite?.long === undefined ? "" : `${(product?.billingSite?.long.replace(/"/g, "'"))}`,
          ShippingDate: shippingDateLTZ,
          InstallationDate: installationDateLTZ,
          SiteMilestone: product?.siteMilestone === undefined ? "" : `${(product?.siteMilestone.replace(/"/g, "'"))}`,
          AccountManager: product?.accountManager ? getContactName(product.accountManager) :"" ,
          ProjectManager: product?.projectManager ? getContactName(product.projectManager) :"" , 
          SupportManager: product?.supportManager ? getContactName(product.supportManager) :"" ,
          SupportExpireDate: SupportExpireDateLTZ,
          TotalSettings: `${(countlistProductTechParamValue != undefined ? countlistProductTechParamValue?.count : '')}`,
          TotalTools: `${(countlistProductToolInstalled != undefined ? countlistProductToolInstalled?.count : '')}`,
          TotalDrawings: `${(countlistProductDrawing != undefined ? countlistProductDrawing?.count : '')}`,
          TotalDocuments: `${(countlistDocument != undefined ? countlistDocument?.count : '')}`,
          TotalLicenses: `${(countlistProductLicense != undefined ? countlistProductLicense?.count : '')}`,
          TotalProfiles: `${(countlistProfileCount != undefined ? countlistProfileCount?.count : '')}`,
          TotalServiceRecords: `${(countlistProductServiceRecords != undefined ? countlistProductServiceRecords?.count : '')}`,
          TotalINI: `${(countlistProductConfiguration != undefined ? countlistProductConfiguration?.count : '')}`,
        };
      } else {
        finalDataObj = {
          SerialNo: `${product?.serialNo.replace(/"/g, "'")}`,
          Name: product?.name === undefined ? "" : (`${product?.name.replace(/"/g, "'")}`),
          MachineModel: product?.machineModel?.name === undefined ? "" : (`${product?.machineModel?.name.replace(/"/g, "'")}`),
          Supplier: product?.supplier?.name === undefined ? "" : (`${product?.supplier?.name?.replace(/"/g, "'")}`),
          Status: product?.status?.name === undefined ? "" : (`${product?.status?.name.replace(/"/g, "'")}`),
          WorkOrderRef: product?.workOrderRef === undefined ? "" : (`${product?.workOrderRef.replace(/"/g, "'")}`),
          FinancialCompany: product?.financialCompany?.name === undefined ? "" : (`${product?.financialCompany?.name.replace(/"/g, "'")}`),
          Customer: product?.customer?.name === undefined ? "" : (`${product?.customer?.name.replace(/"/g, "'")}`),
          InstallationSite: product?.instalationSite?.name === undefined ? "" : (`${product?.instalationSite?.name.replace(/"/g, "'")}`),
          InstallationSiteAddress: `${(fetchAddressCSV(product?.instalationSite?.address).replace(/"/g, "'"))}`,
          InstallationSiteLatitude: product?.instalationSite?.long === undefined ? "" : `${(product?.instalationSite?.long.replace(/"/g, "'"))}`,
          InstallationSiteLongitude: product?.instalationSite?.long === undefined ? "" : `${(product?.instalationSite?.long.replace(/"/g, "'"))}`,
          BillingSite: product?.billingSite?.name === undefined ? "" : `${(product?.billingSite?.name.replace(/"/g, "'"))}`,
          BillingSiteAddress: `${(fetchAddressCSV(product?.billingSite?.address).replace(/"/g, "'"))}`,
          BillingSiteLatitude: product?.billingSite?.long === undefined ? "" : `${(product?.billingSite?.long.replace(/"/g, "'"))}`,
          BillingSiteLongitude: product?.billingSite?.long === undefined ? "" : `${(product?.billingSite?.long.replace(/"/g, "'"))}`,
          ShippingDate: shippingDateLTZ,
          InstallationDate: installationDateLTZ,
          SiteMilestone: product?.siteMilestone === undefined ? "" : `${(product?.siteMilestone.replace(/"/g, "'"))}`,
          AccountManager: product?.accountManager ? getContactName(product.accountManager) :"" ,
          ProjectManager: product?.projectManager ? getContactName(product.projectManager) :"" , 
          SupportManager: product?.supportManager ? getContactName(product.supportManager) :"" ,
          SupportExpireDate: SupportExpireDateLTZ,
          TotalSettings: `${(countlistProductTechParamValue != undefined ? countlistProductTechParamValue?.count : '')}`,
          TotalTools: `${(countlistProductToolInstalled != undefined ? countlistProductToolInstalled?.count : '')}`,
          TotalDrawings: `${(countlistProductDrawing != undefined ? countlistProductDrawing?.count : '')}`,
          TotalDocuments: `${(countlistDocument != undefined ? countlistDocument?.count : '')}`,
          TotalLicenses: `${(countlistProductLicense != undefined ? countlistProductLicense?.count : '')}`,
          TotalProfiles: `${(countlistProfileCount != undefined ? countlistProfileCount?.count : '')}`,
          TotalServiceRecords: `${(countlistProductServiceRecords != undefined ? countlistProductServiceRecords?.count : '')}`,
          TotalINI: `${(countlistProductConfiguration != undefined ? countlistProductConfiguration?.count : '')}`,
        };
      }
      return finalDataObj;
    }));

    return res.send(listObjects);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
};


function getContactName(contacts) {
  if (Array.isArray(contacts)) {
    const names = contacts.map(contact => {
      let fullName = '';

      if (contact && contact.firstName) {
        fullName += contact.firstName.replace(/"/g, "'");
      }

      if (contact && contact.lastName) {
        fullName += ' ' + contact.lastName.replace(/"/g, "'");
      }

      return fullName.trim();
    });

    return names.join(' | ');
  } else if (contacts && (contacts.firstName || contacts.lastName)) {
    let fullName = '';

    if (contacts.firstName) {
      fullName += contacts.firstName.replace(/"/g, "'");
    }

    if (contacts.lastName) {
      fullName += ' ' + contacts.lastName.replace(/"/g, "'");
    }

    return fullName.trim();
  } else {
    return '';
  }
}


function fetchAddressCSV(address) {
  if (!address || typeof address !== 'object') {
    return ''; // Return an empty string or handle the error as needed
  }

  const addressComponents = ['street', 'suburb', 'city', 'region', 'postcode', 'country'];

  const formattedAddressCSV = addressComponents
    .map(component => address[component])
    .filter(value => value !== undefined && value !== null && value !== '')
    .join(', ');

  return formattedAddressCSV;
}

function getDocumentFromReq(req, reqType){
  const { serialNo, name, parentMachine, parentSerialNo, status, supplier, machineModel, 
    workOrderRef, financialCompany, customer, instalationSite, billingSite, operators,
    accountManager, projectManager, supportManager, license, logo, siteMilestone,
    tools, description, internalTags, customerTags, installationDate, shippingDate, supportExpireDate,
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
  if ("financialCompany" in req.body){
    doc.financialCompany = financialCompany;
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

  if ("supportExpireDate" in req.body){
    doc.supportExpireDate = supportExpireDate;
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