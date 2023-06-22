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

const { Product, ProductCategory, ProductModel, ProductConnection, ProductStatus } = require('../models');
const { connectMachines, disconnectMachine_ } = require('./productConnectionController');
const { Customer } = require('../../crm/models')
const { SecurityUser } = require('../../security/models')
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
        let index = 0;
        for(let verification of machine.verifications) {

          console.log("index",index);

          let user = await SecurityUser.findOne({ _id: verification.verifiedBy, isActive: true, isArchived: false }).select('name');
          console.log("user",user);
          if(user) {
            machine.verifications[index].verifiedBy = user;
          }
          else {
            machine.verifications.splice(index, 1);
          }
          index++;                
        }
      }

      res.json(machine);
    }
  }

};

exports.getProducts = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};  
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
  this.query = { connections:true, isActive:true, isArchived:false };
  let machines = [];
  let machienCategories = await dbservice.getObjectList(ProductCategory, this.fields, this.query, this.orderBy, this.populate);
  if(machienCategories && machienCategories.length>0) {

    let categoryIds = machienCategories.map(c => c.id);
    let modelQuery = { category:{$in:categoryIds} ,isActive:true, isArchived:false };
    let machineModels = await dbservice.getObjectList(ProductModel, this.fields, modelQuery, this.orderBy, this.populate);
    if(machineModels && machineModels.length>0) {

      let modelsIds = machineModels.map(m => m.id);
      let machineQuery = { machineModel : {$in:modelsIds} ,isActive:true, isArchived:false};
      this.orderBy = {createdAt : -1};
      machines = await dbservice.getObjectList(Product, this.fields, machineQuery, this.orderBy, this.populate);
      res.status(StatusCodes.OK).json(machines);
    }
    else {
      res.status(StatusCodes.OK).json(machines);
    }
  }
  else {
    res.status(StatusCodes.OK).json(machines);
  }
  
};


exports.deleteProduct = async (req, res, next) => {
  dbservice.deleteObject(Product, req.params.id, callbackFunc);
  //console.log(req.params.id);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
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
      return res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordCustomMessageJSON(StatusCodes.FORBIDDEN, 'Transferred machine cannot be edited'));
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
      if(!req.body.installationSite && (machine.installationDate || machine.shippingDate)){
        req.body.installationDate = null;
        req.body.shippingDate = null;
      } 
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
    function callbackFunc(error, result) {
      if (error) {
        logger.error(new Error(error));
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error._message
          //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        );
      } else {
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
          req.body.machineConnections = parentMachine.machineConnections;

          // change status
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
    isActive, isArchived, loginUser, machineConnections, parentMachineID } = req.body;
  
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
