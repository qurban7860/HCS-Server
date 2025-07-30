const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const _ = require('lodash');
const fs = require('fs');
const { render } = require('template-file');
const path = require('path');
const { renderEmail } = require('../../email/utils');
const { filterAndDeduplicateEmails, verifyEmail } = require('../../email/utils');
const EmailService = require('../../email/service/emailService');
this.email = new EmailService();
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static')

let productDBService = require('../service/productDBService')
let machineEmailService = require('../service/emailService')
const dbservice = new productDBService();

const { Product, ProductProfile, ProductCategory, ProductModel, ProductConfiguration, ProductConnection, ProductStatus, ProductAuditLog, ProductTechParamValue, ProductToolInstalled, ProductNote, ProductDrawing, ProductServiceReports, ProductServiceReportValue, ProductLicense } = require('../models');

const { ErpLog } = require('../../log/models');

const { Document } = require('../../documents/models');
const { connectMachines, disconnectMachine_ } = require('./productConnectionController');
const { postProductAuditLog, patchProductAuditLog } = require('./productAuditLogController');
const { Customer, CustomerSite } = require('../../crm/models')
const { SecurityUser } = require('../../security/models')
const { Region } = require('../../regions/models')
const { Country } = require('../../config/models')
const ObjectId = require('mongoose').Types.ObjectId;
const { fDate } = require('../../../../utils/formatTime');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  {
    path: 'machineModel', select: '_id name category',
    populate: { path: "category", select: "name description connections" }
  },
  { path: 'parentMachine', select: '_id name serialNo supplier machineModel' },
  { path: 'supplier', select: '_id name' },
  { path: 'status', select: '_id name slug' },
  { path: 'customer', select: '_id clientCode name' },
  { path: 'billingSite', select: 'name' },
  { path: 'instalationSite', select: 'name' },
  { path: 'accountManager', select: '_id firstName lastName email' },
  { path: 'projectManager', select: '_id firstName lastName email' },
  { path: 'supportManager', select: '_id firstName lastName email' },
  { path: 'financialCompany', select: '_id clientCode name' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' },
  {
    path: 'transferredToMachine', select: '_id serialNo name customer',
    populate: {
      path: 'customer',
      select: '_id clientCode name'
    }
  },
  {
    path: 'transferredFromMachine', select: '_id serialNo name customer',
    populate: {
      path: 'customer',
      select: '_id clientCode name'
    }
  },
  {
    path: 'statusChangeHistory', select: '_id status dated',
    populate: {
      path: 'status',
      select: '_id name slug'
    }
  }
];

async function processUserRoles(req) {
  if (!req.query.unfiltered) {
    if (
      !req.body.loginUser?.roleTypes?.includes("SuperAdmin") &&
      req?.body?.userInfo?.dataAccessibilityLevel !== 'GLOBAL' &&
      !req.body.loginUser?.roleTypes?.includes("Developer")
    ) {
      let user = await SecurityUser.findById(req.body.loginUser.userId).select(
        "regions customers machines contact"
      ).lean();

      if (user) {
        let finalQuery = {
          $or: [],
        };

        if (Array.isArray(user.regions) && user.regions.length > 0) {
          let regions = await Region.find({ _id: { $in: user.regions } })
            .select("countries")
            .lean();

          let countries = [];
          let countryNames = [];
          let customerSites = [];

          for (let region of regions) {
            if (
              Array.isArray(region.countries) &&
              region.countries.length > 0
            ) {
              countries = [...region.countries];
            }
          }

          if (Array.isArray(countries) && countries.length > 0) {
            let countriesDB = await Country.find({
              _id: { $in: countries },
            }).select("country_name").lean();

            if (Array.isArray(countriesDB) && countriesDB.length > 0)
              countryNames = countriesDB.map((c) => c.country_name);
          }

          let listCustomers__ = [];
          if (Array.isArray(countryNames) && countryNames.length > 0) {
            customerSitesDB = await CustomerSite.find({
              "address.country": { $in: countryNames },
            }).select("_id").lean();

            if (Array.isArray(customerSitesDB) && customerSitesDB.length > 0)
              customerSites = customerSitesDB.map((site) => site._id);

            listCustomers__ = await Customer.find({
              mainSite: { $in: customerSites },
            }).select("_id").lean();
          }

          let customerQuery = { $in: listCustomers__ };
          finalQuery.$or.push({ customer: customerQuery });

          if (Array.isArray(customerSites) && customerSites.length > 0) {
            let customers = await Customer.find({
              mainSite: { $in: customerSites },
            }).lean();
            if (Array.isArray(customers) && customers.length > 0) {
              let customerIDs = customers.map((customer) => customer._id);
              finalQuery.$or.push({ customer: customerIDs });
            }
          }
        }

        if (Array.isArray(user.machines) && user.machines.length > 0) {
          let idQuery = { $in: user.machines };
          finalQuery.$or.push({ _id: idQuery });
        }

        if (Array.isArray(user.customers) && user.customers.length > 0) {
          let customerQuery = { $in: user.customers };
          finalQuery.$or.push({ customer: customerQuery });
        }

        // project, support and account manager query.
        if (req?.body?.userInfo?.contact) {
          // Allowed customer from machines.
          const query___ = {
            $or: [
              { accountManager: req?.body?.userInfo?.contact },
              { projectManager: req?.body?.userInfo?.contact },
              { supportManager: req?.body?.userInfo?.contact }
            ]
          };

          // Allowed by customer
          let customerAllowed = await Customer.find(query___).select('_id').lean();
          const customerIds = customerAllowed.map(customer => customer._id);
          if (customerIds && customerIds.length > 0)
            finalQuery.$or.push({ customer: { $in: customerIds } });

          // Allowed Machines
          const productCustomers = await Product.find(query___).select('_id').lean();
          if (productCustomers && productCustomers.length > 0) {
            finalQuery.$or.push({ _id: { $in: productCustomers } });
          }
        }

        if (finalQuery.$or.length > 0) {
          return finalQuery;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else {
      delete req.query.unfiltered;
      return null
    }
  } else {
    return false;
  }
}

exports.getProduct = async (req, res, next) => {
  const queryString = await processUserRoles(req);
  if (queryString) {
    const query_ = { ...queryString, _id: req.params.id };
    const proObj = await Product.findOne(query_).select('_id').lean();

    if (!proObj) {
      return res.status(StatusCodes.BAD_REQUEST).send("Access denied for the machine is not permitted by the administrator.");
    }
  }

  delete req.query.unfiltered;


  if (!req.params.id || !ObjectId.isValid(req.params.id)) {
    return res.status(StatusCodes.BAD_REQUEST).send("Machine uuid is not valid!");
  }
  dbservice.getObjectById(Product, this.fields, req.params.id, this.populate, callbackFunc);
  async function callbackFunc(error, machine) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {

      machine = JSON.parse(JSON.stringify(machine));

      if (machine && Array.isArray(machine.machineConnections) && machine.machineConnections.length > 0) {
        let query_ = { _id: { $in: machine.machineConnections }, isActive: true, isArchived: false };
        let populate = { path: 'connectedMachine', select: '_id name serialNo machine' }
        machine = JSON.parse(JSON.stringify(machine));


        let machineConnections = await dbservice.getObjectList(req, ProductConnection, this.fields, query_, {}, populate);
        if (Array.isArray(machineConnections) && machineConnections.length > 0) {
          machineConnections = JSON.parse(JSON.stringify(machineConnections));
          let index = 0;
          for (let machineConnection of machineConnections) {
            if (machineConnection && machineConnection.connectedMachine) {
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

      if (Array.isArray(machine.verifications) && machine.verifications.length > 0) {
        let machineVerifications = [];

        for (let verification of machine.verifications) {
          let user = await SecurityUser.findOne({ _id: verification.verifiedBy, isActive: true, isArchived: false }).select('name');

          if (user) {
            verification.verifiedBy = user;
            machineVerifications.push(verification);
          }

        }
        machine.verifications = machineVerifications;
      }

      let machineProfileQuery = { type: "MANUFACTURE", machine: machine._id, isActive: true, isArchived: machine.isArchived };
      machine.machineProfiles = await ProductProfile.find(machineProfileQuery).select('names defaultName web flange').sort({ _id: 1 });


      if (machine && machine.machineModel && machine.machineModel.category && machine.machineModel.category.connections) {
        let queryString_ = { connectedMachine: machine._id, disconnectionDate: { $exists: false } };
        machine.parentMachines = await ProductConnection.find(queryString_).sort({ _id: -1 }).select('machine').populate({ path: 'machine', select: 'serialNo' });
      }

      if (machine?.globelMachineID && ObjectId.isValid(machine?.globelMachineID)) {
        const populateArray_ = [
          { path: 'customer', select: '_id clientCode name' },
          { path: 'transferredToMachine', select: '_id serialNo name customer' },
          { path: 'transferredToMachine', select: '_id serialNo name customer' },
        ];
        let productLists = await Product
          .find({ globelMachineID: machine.globelMachineID })
          .select('_id purchaseDate shippingDate transferredDate transferredToMachine transferredFromMachine customer')
          .populate(populateArray_)
          .lean();

        productLists.forEach(product => {
          if (!product.purchaseDate || product?.purchaseDate === '') {
            product.purchaseDate = product.shippingDate;
          }
        });

        productLists.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));

        // let productLists = await Product.aggregate([
        //   { $match: { globelMachineID: ObjectId(machine.globelMachineID) } },
        //   { $project: { purchaseDate: 1,  transferredDate: 1,  transferredToMachine: 1,  transferredFromMachine: 1, customer: 1} },
        //   { $sort: { purchaseDate: -1 } }
        // ]);
        // productLists = await Product.populate(productLists, populateArray_);

        if (
          productLists?.length === 1 &&
          productLists[0]?.globelMachineID !== undefined &&
          machine !== undefined &&
          productLists[0]?.globelMachineID.toString() === machine?._id?.toString()
        ) {
          productLists = [];
        }
        machine.transferredHistory = productLists;
      }
      res.json(machine);
    }
  }
};

exports.getProducts = async (req, res, next) => {
  const listPopulate = [
    { path: 'parentMachine', select: '_id serialNo name ' },
    { path: 'machineModel', select: '_id name category', populate: { path: 'category', select: '_id name' } },
    { path: 'status', select: '_id name slug' },
    { path: 'customer', select: '_id clientCode name' },
    {
      path: 'transferredToMachine',
      select: '_id serialNo customer',
      populate: { path: 'customer', select: '_id clientCode name' }
    }
  ];

  if (req.query.customer) {
    listPopulate.push({ path: 'instalationSite', select: '' });
  }

  const listFields = 'serialNo name model customer manufactureDate installationDate shippingDate supportManager projectManager accountManager verifications status transferredDate transferredToMachine isActive  createdAt';

  this.query = req.query != "undefined" ? req.query : {};
  this.orderBy = { serialNo: 1, name: 1 };


  if (this.query.orderBy) {
    this.orderBy = this.query.orderBy;
    delete this.query.orderBy;
  }
  if (this.query.customerArr) {
    const customerIds = JSON.parse(this.query.customerArr);
    this.query.customer = { $in: customerIds };
    delete this.query.customerArr;
  }

  const queryString = await processUserRoles(req);
  if (queryString) {
    if (queryString.$or.length > 0) {
      this.query = {
        ...this.query,
        ...queryString
      }
    }
  }

  delete req.query.unfiltered;

  if (!this.query.customer) {
    let listCustomers = await Customer.find({ "excludeReports": { $ne: true } }).select('_id').lean();
    let customerIds = listCustomers.map((c) => c._id);
    this.query.customer = { $in: customerIds };
  }


  // console.log(JSON.stringify(this.query));
  dbservice.getObjectList(req, Product, listFields, this.query, this.orderBy, listPopulate, callbackFunc);
  async function callbackFunc(error, products) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      const machineProfileQuery = { type: "MANUFACTURE", isActive: true, isArchived: false };
      const machineProfiles = await ProductProfile.find(machineProfileQuery).select('machine names defaultName web flange').sort({ _id: 1 });
      products = products.map(product => product.toObject());
      for (const [index, product] of products.entries()) {
        const profiles = machineProfiles.filter(profile => profile.machine + '' === product._id + '');
        if (profiles) {
          products[index].profiles = profiles;
        }
      }

      if (req.query.getConnectedMachine) {
        let index = 0;
        let filteredProducts = [];
        for (let product of products) {
          if (product && product.machineModel && product.machineModel.category &&
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

exports.getMachineLifeCycle = async (req, res, next) => {
  try {
    const machine = await Product.findById(req.params.id)
      .select('manufactureDate purchaseDate shippingDate installationDate decommissionedDate transferredDate portalKey')
      .lean();

    if (!machine) {
      return res.status(StatusCodes.NOT_FOUND).send("Machine not found.");
    }

    let allLifeCycleDates = [];
    const currentDate = new Date();

    if (machine.manufactureDate) {
      allLifeCycleDates.push({ type: 'Manufacture Date', date: machine.manufactureDate });
    }
    if (machine.purchaseDate) {
      allLifeCycleDates.push({ type: 'Purchase Date', date: machine.purchaseDate });
    }
    if (machine.shippingDate) {
      allLifeCycleDates.push({ type: 'Shipping Date', date: machine.shippingDate });
    }
    if (machine.installationDate) {
      allLifeCycleDates.push({ type: 'Installation Date', date: machine.installationDate });
    }
    if (machine.decommissionedDate) {
      allLifeCycleDates.push({ type: 'Decommissioned Date', date: machine.decommissionedDate });
    }
    if (machine.transferredDate) {
      allLifeCycleDates.push({ type: 'Transfer Date', date: machine.transferredDate });
    }

    if (Array.isArray(machine.portalKey) && machine.portalKey.length > 0) {
      machine.portalKey.forEach(keyItem => {
        if (keyItem.createdAt) {
          allLifeCycleDates.push({ type: 'Portal Connection Date', date: keyItem.createdAt });
        }
      });
    } else if (machine.portalKey && typeof machine.portalKey === 'object' && machine.portalKey.createdAt) {
      allLifeCycleDates.push({ type: 'Portal Connection Date', date: machine.portalKey.createdAt });
    }

    const serviceReportQuery = { machine: req.params.id, isArchived: false, isActive: true }
    const serviceReports = await ProductServiceReports.find(serviceReportQuery).select('serviceDate serviceReportUID _id').lean();

    serviceReports.forEach(report => {
      if (report.serviceDate) {
        allLifeCycleDates.push({ type: 'Service Report Date', date: report.serviceDate, serviceReportUID: report.serviceReportUID, id: report._id });
      }
    });

    allLifeCycleDates = allLifeCycleDates?.filter(item => isValidDate(item.date) && (new Date(item.date) <= currentDate))?.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(StatusCodes.OK).json(allLifeCycleDates || []);

  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Error fetching machine life cycle.");
  }
};

exports.getProductId = async (req, res, next) => {
  const queryString = await processUserRoles(req);

  if (!req?.query?.serialNo) {
    return res.status(StatusCodes.BAD_REQUEST).send("provide serial No and custoemr reference number!");
  }

  const customerObj_ = await Customer.findOne({ ref: req.query.ref }).select('_id').lean();
  let queryStringVal = { serialNo: req.query.serialNo };

  if (customerObj_?._id) {
    queryStringVal.customer = customerObj_._id
  }

  const product_ = await Product.findOne(queryStringVal).sort({ _id: -1 }).select('_id').lean();
  if (product_) {
    if (queryString) {
      const query_ = { ...queryString, _id: product_._id };
      const proObj = await Product.findOne(query_).select('_id').lean();

      if (!proObj) {
        return res.status(StatusCodes.BAD_REQUEST).send("Access denied for the machine is not permitted by the administrator.");
      }
    }

    delete req.query.unfiltered;
    if (!product_._id || !ObjectId.isValid(product_._id)) {
      return res.status(StatusCodes.BAD_REQUEST).send("Machine uuid is not valid!");
    }
    res.json(product_);
  } else {
    return res.status(StatusCodes.BAD_REQUEST).send("Machine not found!");
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

  if (this.query.countries) {
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
      // let machineAuditLog = createMachineAuditLogRequest(machine, 'Delete', req.body.loginUser.userId)
      // await postProductAuditLog(machineAuditLog);
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postProduct = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("errors machine patch request", errors);
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    const duplicateReport = await exports.checkDuplicateSerialNumber(req, res, null, false);
    if (duplicateReport) {
      return res.status(StatusCodes.BAD_REQUEST).json("The serialNo is already linked to a machine.");
    }

    let listNewConnection = [];
    if (req.body.newConnectedMachines && req.body.newConnectedMachines.length > 0) {
      let listMachineCategories = await ProductCategory.find({ connections: true, isActive: true, isArchived: false }).select('_id').lean();
      listMachineCategories = listMachineCategories.map(item => item._id.toString());
      let listMachineModels = null;
      if (listMachineCategories?.length > 0) {
        listMachineModels = await ProductModel.find({ category: { $in: listMachineCategories } }).select('_id').lean();
        listMachineModels = listMachineModels.map(item => item._id.toString());
      }
      if (listMachineModels?.length > 0) {
        await Promise.all(req.body.newConnectedMachines.map(childMachine =>
          postConnectedProductAsync(req, childMachine, listMachineCategories, listMachineModels)
        ))
          .then((results) => {
            listNewConnection.push(...results);
          })
          .catch((error) => {
            console.error("Error:", error);
          });
        const filteredIds = await listNewConnection.map(item => item?._id);

        if (req.body.machineConnections === undefined) {
          req.body.machineConnections = [];
        }
        req.body.machineConnections.push(...filteredIds);
      }
    }

    let machineConnections = req.body.machineConnections;
    req.body.machineConnections = [];
    dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
    async function callbackFunc(error, machine) {
      if (error) {
        logger.error(new Error(error));
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
          error._message
        );
      } else {
        try {
          let machineAuditLog = createMachineAuditLogRequest("PRODUCT", 'CREATE', req.body, machine);
          await postProductAuditLog(machineAuditLog);
        } catch (e) {
          console.error(e);
        }

        if (machine && Array.isArray(machineConnections) && machineConnections.length > 0)
          machine = await connectMachines(machine.id, machineConnections);

        return res.status(StatusCodes.CREATED).json({ Machine: machine });
      }
    }
  }
};

const postConnectedProductAsync = async (req, childMachine, listMachineCategories, listMachineModels) => {
  if (listMachineModels.includes(childMachine.model?.toString())) {
    const childReq = {
      ...req,
      body: {
        ...req.body,
        ...childMachine,
        loginUser: req.body.loginUser,
        customer: req.body.customer,
        machineConnections: childMachine.machineConnections,
        newConnectedMachines: null
      }
    };
    return exports.postConnectedProduct(childReq);
  }
};

exports.postConnectedProduct = async (req) => {
  const errors = validationResult(req);
  let ProductObj = {};

  if (!errors.isEmpty()) {
    return ProductObj;
  } else {
    let machineConnections = req.body.machineConnections;
    req.body.machineConnections = [];

    try {
      ProductObj = await dbservice.postObject(getDocumentFromReq(req, 'new'));
      let machineAuditLog = createMachineAuditLogRequest(ProductObj, 'Create', req.body.loginUser.userId);
      //await postProductAuditLog(machineAuditLog);

      if (ProductObj && Array.isArray(machineConnections) && machineConnections.length > 0) {
        ProductObj = await connectMachines(ProductObj.id, machineConnections);
      }

      return ProductObj;
    } catch (error) {
      console.error("Error in postConnectedProduct:", error);
      return ProductObj;
    }
  }
};

exports.patchProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } else {
      await updateArchivedStatus(req);
      const duplicateReport = await exports.checkDuplicateSerialNumber(req, res, req.params.id, false);
      if (duplicateReport) {
        return res.status(StatusCodes.BAD_REQUEST).json("The serialNo is already linked to a machine.");
      }

      let machine = await dbservice.getObjectById(Product, this.fields, req.params.id, this.populate);
      if (machine.status?.slug && machine.status.slug === 'transferred' && !("isArchived" in req.body)) {
        if (!("isVerified" in req.body)) {
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Transferred machine cannot be edited'));
        }
      }


      if (machine && req.body.isVerified) {
        if (!Array.isArray(machine.verifications))
          machine.verifications = [];

        for (let verif of machine.verifications) {
          if (verif.verifiedBy == req.body.loginUser.userId)
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Already verified" });
        }
        machine.verifications.push({
          verifiedBy: req.body.loginUser.userId,
          verifiedDate: new Date()
        })
        machine = await machine.save();
        return res.status(StatusCodes.ACCEPTED).json(machine);
      }

      if (machine && "updateTransferStatus" in req.body && req.body.updateTransferStatus) {
        let queryString = { slug: 'intransfer' }
        let machineStatus = await dbservice.getObject(ProductStatus, queryString, this.populate);
        if (machineStatus) {
          req.body.status = machineStatus._id;
        }
      }
      else {
        if (machine && Array.isArray(machine.machineConnections) && Array.isArray(req.body.machineConnections)) {
          let oldMachineConnections = machine.machineConnections;
          let newMachineConnections = req.body.machineConnections;
          let isSame = _.isEqual(oldMachineConnections.sort(), newMachineConnections.sort());
          if (!isSame) {
            let toBeDisconnected = oldMachineConnections.filter(x => !newMachineConnections.includes(x.toString()));
            if (toBeDisconnected.length > 0) {
              machine = await disconnectMachine_(machine.id, toBeDisconnected);
            }
            let toBeConnected = newMachineConnections.filter(x => !oldMachineConnections.includes(x));
            if (toBeConnected.length > 0) {
              machine = await connectMachines(machine.id, toBeConnected);
            }
            req.body.machineConnections = machine.machineConnections;
          }
        }
      }



      await dbservice.patchObject(Product, req.params.id, getDocumentFromReq(req));
      // async function callbackFunc(error, result) {
      //   if (error) {
      //     console.log({ error })
      //     logger.error(new Error(error));
      //     res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      //       error._message
      //       //getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
      //     );
      //   } else {
      if ((machine?.customer?._id || req.body?.customer) && (machine?.customer?._id?.toString() !== req.body?.customer)) {
        let loginUser = await SecurityUser.findById(req.body.loginUser.userId).select("name email roles").populate({ path: 'roles', select: 'name' }).lean();
        const allowedRoles = ['SuperAdmin', 'Sales Manager', 'Technical Manager']
        if (loginUser?.roles?.some(r => allowedRoles?.includes(r?.name))) {
          await machineEmailService.machineCustomerChange({ req, machine, loginUser })
        } else {
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'You do not have the right to change the customer!'));
        }
      }
      if (req.body?.isUpdateConnectedMachines) {
        if (Array.isArray(req.body?.machineConnections) && req.body?.machineConnections?.length > 0) {
          // try {
          const validateIds = req.body?.machineConnections?.map(id => mongoose.Types.ObjectId(id))
          const getMachineConnections = await ProductConnection.find({ _id: { $in: validateIds } });
          const machineIds = getMachineConnections?.map(el => mongoose.Types.ObjectId(el?.connectedMachine))
          const updateClause = { $set: {} };
          if (req.body.customer) updateClause.$set.customer = req.body.customer;
          if (req.body.instalationSite) updateClause.$set.instalationSite = req.body.instalationSite;
          if (req.body.siteMilestone) updateClause.$set.siteMilestone = req.body.siteMilestone;
          if (req.body.billingSite) updateClause.$set.billingSite = req.body.billingSite;
          if (req.body.manufactureDate) updateClause.$set.manufactureDate = req.body.manufactureDate;
          if (req.body.purchaseDate) updateClause.$set.purchaseDate = req.body.purchaseDate;
          if (req.body.shippingDate) updateClause.$set.shippingDate = req.body.shippingDate;
          if (req.body.installationDate) updateClause.$set.installationDate = req.body.installationDate;
          if (req.body.decommissionedDate) updateClause.$set.decommissionedDate = req.body.decommissionedDate;
          if (req.body.supportExpireDate) updateClause.$set.supportExpireDate = req.body.supportExpireDate;
          if (req.body.accountManager) updateClause.$set.accountManager = req.body.accountManager;
          if (req.body.projectManager) updateClause.$set.projectManager = req.body.projectManager;
          if (req.body.supportManager) updateClause.$set.supportManager = req.body.supportManager;
          const isUpdated = await Product.updateMany({ _id: { $in: machineIds } }, updateClause);
          // } catch (err) {
          //   logger.error(new Error(err));
          //   return res.status(StatusCodes.ACCEPTED).send("Update Connected machines failed!");
          // }
        }
      }
      // let machineAuditLog = createMachineAuditLogRequest(machine, 'Update', req.body.loginUser.userId);
      // await postProductAuditLog(machineAuditLog);
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordUpdateMessage(StatusCodes.ACCEPTED));
      // }
      // }
    }
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error?.message || error);
  }
};

function isValidDate(dateString) {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

exports.patchProductStatus = async (req, res, next) => {
  let params = {};
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("errors machine patch request", errors);
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    const statusid = req.params.statusid;

    if (!isValidDate(req.body.dated)) {
      return res.status(StatusCodes.BAD_REQUEST).send(`The validation parameter for the date is not valid.`);
    }

    const productObj = await Product.findOne({ _id: req.params.id })
      .select('_id serialNo machineModel status accountManager projectManager supportManager')
      .populate({ path: 'machineModel', select: 'name' })
      .populate({ path: 'status', select: '_id name' })
      .populate({ path: 'customer', select: '_id name' })
      .populate({ path: 'instalationSite', select: '_id name' })
      .populate({ path: 'billingSite', select: '_id name' })
      .populate({ path: 'accountManager', select: '_id email' })
      .populate({ path: 'projectManager', select: '_id email' })
      .populate({ path: 'supportManager', select: '_id email' })
      .lean();
    params.machineId = productObj?._id;
    params.model = productObj?.machineModel?.name;
    params.serialNo = productObj?.serialNo;
    params.previousStatus = productObj?.status?.name;
    params.customer = productObj?.customer?.name;
    params.installationSite = productObj?.instalationSite?.name;
    params.billingSite = productObj?.billingSite?.name;
    params.managers = [...productObj?.accountManager, ...productObj?.projectManager, ...productObj?.supportManager];
    params.subject = 'Machine status notification';
    if (!productObj) {
      return res.status(StatusCodes.BAD_REQUEST).send(`Please provide valid product Id to proceed!`);
    }

    const productStatus = await ProductStatus.findOne({ _id: statusid, isActive: true, isArchived: false }).select('_id slug name').lean();
    params.status = productStatus?.name || '';
    if (!productStatus) {
      return res.status(StatusCodes.BAD_REQUEST).send(`Please provide valid status Id to proceed!`);
    } else {
      if (productObj.status == statusid) {
        return res.status(StatusCodes.BAD_REQUEST).send(`Attempting to update the status(${productStatus?.name}) that the machine already possesses!`);
      }
    }

    if (productStatus?.slug === 'transferred') {
      return res.status(StatusCodes.BAD_REQUEST).send(`you can not change directly to transferred from here`);
    }

    const whereClause = { _id: req.params.id, isActive: true, isArchived: false };
    const statusChangeHistory = { status: statusid, dated: req.body.dated };
    const updateClause = {
      $push: { statusChangeHistory: { $each: [statusChangeHistory], $position: 0 } },
      $set: { status: statusid }
    };

    if (productStatus?.slug === 'assembly') {
      updateClause.$set.manufactureDate = req.body.dated;
      params.manufactureDate = fDate(req.body.dated);
    } else if (productStatus?.slug === 'freight') {
      updateClause.$set.shippingDate = req.body.dated;
      params.shippingDate = fDate(req.body.dated);
    } else if (productStatus?.slug === 'decommissioned') {
      updateClause.$set.decommissionedDate = req.body.dated;
      params.decommissionedDate = fDate(req.body.dated);
    } else if (productStatus?.slug === 'commissioned') {
      updateClause.$set.installationDate = req.body.dated;
      params.installationDate = fDate(req.body.dated);
    }

    const updatedProcess = await Product.updateOne(whereClause, updateClause);
    if (req.body?.updateConnectedMachines && (req.body?.updateConnectedMachines === true || req.body?.updateConnectedMachines == 'true')) {
      const whereClause_ = { machine: req.params.id, isActive: true, isArchived: false };
      try {
        const machinePopulate = [
          {
            path: "connectedMachine", select: "serialNo machineModel",
            populate: { path: "machineModel", select: "name" }
          }
        ]

        const connectionsToUpdate = await ProductConnection.find(whereClause_).select('connectedMachine').populate(machinePopulate).lean();
        if (Array.isArray(connectionsToUpdate)) {
          params.connectedMachines = await connectionsToUpdate.map((mc) => `${mc?.connectedMachine?.serialNo} - ${mc?.connectedMachine?.machineModel?.name}`).join(', ');
        }
        const connectedMachineIds = connectionsToUpdate.map(connection => connection.connectedMachine._id);
        if (connectedMachineIds?.length > 0) {
          await Product.updateMany({ _id: { $in: connectedMachineIds }, isActive: true, isArchived: false }, updateClause);
        }
      } catch (error) {
        console.error("Error updating ProductConnection:", error);
      }
    }
    if (updatedProcess) {
      exports.sendEmailAlert(req, params);
      return res.status(StatusCodes.ACCEPTED).send("Status updated successfully!");
    } else {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }
  }
};

async function updateArchivedStatus(req) {
  if ("isArchived" in req.body) {
    const machineid = req.params.id;
    const isArchived = req.body.isArchived;
    let whereClause = { machine: machineid, isArchived: !isArchived };
    if (!isArchived) {
      whereClause.archivedByMachine = true;
    }
    const setClause = { isArchived: isArchived, archivedByMachine: isArchived };
    await ProductTechParamValue.updateMany(whereClause, setClause);
    await ProductToolInstalled.updateMany(whereClause, setClause);
    await ProductNote.updateMany(whereClause, setClause);
    await ProductDrawing.updateMany(whereClause, setClause);
    await Document.updateMany(whereClause, setClause);
    await ProductLicense.updateMany(whereClause, setClause);
    await ProductProfile.updateMany(whereClause, setClause);
    await ProductServiceReports.updateMany(whereClause, setClause);
    await ProductServiceReportValue.updateMany(whereClause, setClause);
    await ProductConfiguration.updateMany(whereClause, setClause);
    // await ErpLog.updateMany(whereClause, setClause); //optional
  }
}

exports.transferOwnership = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      const machinePopulate = [
        { path: "machineModel", select: "name" },
        { path: 'customer', select: 'name' },
        { path: 'billingSite', select: 'name' },
        { path: 'installationSite', select: 'name' },
        { path: 'status', select: 'name' },
        { path: 'accountManager', select: 'email' },
        { path: 'projectManager', select: 'email' },
        { path: 'supportManager', select: 'email' },
        {
          path: 'machineConnections', select: 'connectedMachine',
          populate: {
            path: "connectedMachine", select: "serialNo machineModel",
            populate: { path: "machineModel", select: "name" }
          }
        }
      ]

      let params = {};
      let newParams = {};
      if (ObjectId.isValid(req.body.machine)) {
        let parentMachine = await dbservice.getObjectById(Product, this.fields, req.body.machine, machinePopulate);
        params.machineId = parentMachine?._id;
        params.model = parentMachine?.machineModel?.name;
        params.serialNo = parentMachine?.serialNo;
        params.customer = parentMachine?.customer?.name || '';
        params.managers = [...parentMachine?.accountManager, ...parentMachine?.projectManager, ...parentMachine?.supportManager];
        params.subject = 'Machine Transferred';
        if (Array.isArray(parentMachine.machineConnections)) {
          params.connectedMachines = await parentMachine?.machineConnections.map((mc) => `${mc?.connectedMachine?.serialNo} - ${mc?.connectedMachine?.machineModel.name}`).join(', ');
        }
        const globelMachineID = parentMachine?.globelMachineID && ObjectId.isValid(parentMachine.globelMachineID) ? parentMachine.globelMachineID : req.body.machine;
        if (!parentMachine) {
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordMissingParamsMessage(StatusCodes.BAD_REQUEST, 'Product'));
        }
        // validate if the machine has a valid status
        if (!(parentMachine.customer)) {
          return res.status(StatusCodes.BAD_REQUEST).send("Machine without a customer cannot be transferred");
        }
        if (isNonTransferrableMachine(parentMachine.status)) {
          return res.status(StatusCodes.BAD_REQUEST).send("Machine status invalid for transfer");
        }
        if (!parentMachine.isActive || parentMachine.isArchived) {
          return res.status(StatusCodes.BAD_REQUEST).send("Inactive or archived machines cannot be transferred");
        }
        // validate if an entry already exists with the same customer and transferredFromMachine
        let alreadyTransferredParentMachine = await dbservice.getObject(Product, { customer: req.body.customerId, transferredFromMachine: req.body.machine, isActive: true, isArchived: false }, this.populate);
        if (alreadyTransferredParentMachine) {
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordDuplicateRecordMessage(StatusCodes.BAD_REQUEST));
        }

        // Verify if this machine has already been transferred to any customer
        const alreadyTransferred = await Product.findOne({
          transferredFromMachine: req.body.machine,
          isActive: true,
          isArchived: false
        }).select('_id customer').populate('customer', 'name');

        if (alreadyTransferred) {
          return res.status(StatusCodes.BAD_REQUEST).send(
            `This machine has already been transferred to customer "${alreadyTransferred.customer?.name || 'Unknown'}". A machine can only be transferred once.`
          );
        }

        // Also check if the machine's status is already 'transferred'
        if (parentMachine.status && parentMachine.status.slug === 'transferred') {
          return res.status(StatusCodes.BAD_REQUEST).send(
            "This machine has already been transferred and cannot be transferred again."
          );
        }

        const transferredDate = req.body.transferredDate;
        if (parentMachine) {
          req.body.serialNo = parentMachine.serialNo;
          req.body.machineModel = parentMachine.machineModel;
          req.body.parentMachine = parentMachine.parentMachine;
          req.body.parentSerialNo = parentMachine.parentSerialNo;
          req.body.transferredFromMachine = parentMachine._id;
          req.body.transferredDate = null;
          req.body.purchaseDate = transferredDate;
          params.transferredDate = transferredDate ? fDate(transferredDate) : '';
          req.body.manufactureDate = parentMachine.manufactureDate;
          req.body.globelMachineID = globelMachineID;
          req.body.alias = parentMachine.alias;
          req.body.operators = parentMachine.operators;
          req.body.internalTags = parentMachine.internalTags;
          req.body.customerTags = parentMachine.customerTags;

          if (req.body.installationSite && ObjectId.isValid(req.body.installationSite)) req.body.instalationSite = req.body.installationSite;

          if (!req.body.status) {
            // update status of the new(transferred) machine
            let queryString = { slug: 'intransfer' }
            let machineStatus = await dbservice.getObject(ProductStatus, queryString, this.populate);
            if (machineStatus) {
              req.body.status = machineStatus._id;
            }
          }
          queryString = { slug: 'transferred' }
          let parentMachineStatus = await dbservice.getObject(ProductStatus, queryString, this.populate);
          if (!parentMachineStatus) {
            return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordMissingParamsMessage(StatusCodes.BAD_REQUEST, this.ProductStatus));
          } else {
            const newMachineAfterTranspher = await dbservice.postObject(getDocumentFromReq(req, 'new'));
            if (newMachineAfterTranspher) {
              const whereClause = { machine: req.body.machine, isArchived: false, isActive: true };
              const setClause = { machine: newMachineAfterTranspher._id };
              await disconnectConnections(req, newMachineAfterTranspher._id, transferredDate);

              if (req.body.isAllSettings && (req.body.isAllSettings == 'true' || req.body.isAllSettings == true)) {
                const responseProductTechParamValue = await ProductTechParamValue.updateMany(whereClause, setClause);
              }

              if (req.body.isAllTools && (req.body.isAllTools == 'true' || req.body.isAllTools == true)) {
                req.body.tools = parentMachine.tools;
                const responseProductToolInstalled = await ProductToolInstalled.updateMany(whereClause, setClause);
              }

              if (req.body.isAllDrawings && (req.body.isAllDrawings == 'true' || req.body.isAllDrawings == true)) {
                const responseProductDrawing = await ProductDrawing.updateMany(whereClause, setClause);
              }

              if (req.body.isAllProfiles && (req.body.isAllProfiles == 'true' || req.body.isAllProfiles == true)) {
                const responseProductProfile = await ProductProfile.updateMany(whereClause, setClause);
              }

              if (req.body.isAllINIs && (req.body.isAllINIs == 'true' || req.body.isAllINIs == true)) {
                const responseProductConfiguration = await ProductConfiguration.updateMany(whereClause, setClause);
              }
              // Step 3 List document for selection to transfer to new machine id
              if (req.body.machineDocuments && req.body.machineDocuments.length > 0) {
                const responseDocument = await Document.updateMany({ _id: { $in: req.body.machineDocuments } }, setClause);
              }
              // Step 4 List of existing connected machines to choose to move with new machine id. 
              if (req.body.machineConnections && req.body.machineConnections.length > 0) {
                const responseMachineConnection = await ProductConnection.updateMany({ machine: { $in: req.body.machineConnections } }, setClause);
              }
              // update old machine ownsership status
              let parentMachineUpdated = await dbservice.patchObject(Product, req.body.machine, {
                transferredToMachine: newMachineAfterTranspher._id,
                transferredDate: transferredDate,
                isActive: false,
                status: parentMachineStatus._id,
                globelMachineID: globelMachineID
              });
              if (parentMachineUpdated) {
                await createMachineAuditLogRequest(parentMachine, 'Transfer', req.body.loginUser.userId);
                let newMachineData = await dbservice.getObjectById(Product, this.fields, newMachineAfterTranspher?._id, machinePopulate);
                newParams.machineId = newMachineData?._id;
                newParams.model = newMachineData?.machineModel?.name;
                newParams.serialNo = newMachineData?.serialNo;
                newParams.customer = newMachineData?.customer?.name || '';
                newParams.status = newMachineData?.status?.name || '';
                newParams.transferred = true;
                newParams.billingSite = newMachineData?.billingSite?.name || '';
                newParams.installationSite = newMachineData?.instalationSite?.name || '';
                newParams.installationDate = newMachineData?.installationDate ? fDate(newMachineData?.installationDate) : '';
                newParams.shippingDate = newMachineData?.shippingDate ? fDate(newMachineData?.shippingDate) : '';
                newParams.manufactureDate = newMachineData?.manufactureDate ? fDate(newMachineData?.manufactureDate) : '';
                newParams.managers = [...newMachineData?.accountManager, ...newMachineData?.projectManager, ...newMachineData?.supportManager];
                newParams.subject = 'Machine Status Notification';
                if (Array.isArray(newMachineData.machineConnections)) {
                  newParams.connectedMachines = await newMachineData?.machineConnections.map((mc) => `${mc?.connectedMachine?.serialNo} - ${mc?.connectedMachine?.machineModel.name}`).join(', ');
                }
                await exports.sendEmailAlert(req, params);
                await exports.sendEmailAlert(req, newParams);
                res.status(StatusCodes.CREATED).json({ Machine: newMachineAfterTranspher });
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

const disconnectConnections = async (request, newMachineId, transferredDate) => {
  const connectionToMove = request.body.machineConnections;

  if (newMachineId && ObjectId.isValid(newMachineId) && connectionToMove && Array.isArray(connectionToMove) && connectionToMove.length > 0) {

    listConnectedMachine = await ProductConnection.find({ _id: { $in: connectionToMove } }).select('-_id connectedMachine').lean();
    listConnectedMachineIds = listConnectedMachine.map((mach) => mach.connectedMachine);

    try {
      const query = {
        connectedMachine: { $in: listConnectedMachineIds },
        disconnectionDate: { $exists: false },
        isActive: true,
        machine: { '$ne': request.body.machine }
      };

      const connectionsWithOtherMachines = await ProductConnection
        .find(query)
        .select('machine connectedMachine serialNo')
        .populate([
          { path: 'connectedMachine', select: 'serialNo' }
        ]).lean();


      //Remove connectionToMove from other machines.
      await Promise.all(connectionsWithOtherMachines.map(async (connection) => {
        await Product.updateOne(
          { _id: connection.machine },
          { $pull: { machineConnections: connection._id } }
        );
      }));

      // console.log(query);

      //Disconnect All connected machines connections.
      const updateValue = { disconnectionDate: new Date(), isActive: false };
      await ProductConnection.updateMany({ _id: { $in: connectionsWithOtherMachines.map(conn => conn._id) } }, updateValue);


      //Update connection Machine Data to new machine data.
      try {
        let updateProduct = updateConnectingMachine(request, transferredDate);
        const queryS_ = { _id: { $in: listConnectedMachineIds } };
        await Product.updateMany(queryS_, { $set: updateProduct });
      } catch (error) {
        console.log("error", error);
      }


      //Update Connections to New Machines.
      const updateQuery = { machine: { '$eq': request.body.machine }, _id: { '$in': connectionToMove }, isActive: true };
      await ProductConnection.updateMany(updateQuery, { $set: { machine: newMachineId } });

      // New Product to have new Connections
      // console.log("updateQuery", updateQuery);
      delete updateQuery.machine;
      const productConnections = await ProductConnection.find(updateQuery).select('_id');
      // console.log("productConnections", productConnections);

      await Product.updateOne({ _id: newMachineId }, { $set: { machineConnections: productConnections } });

      // Old machine to remove connection to move.
      await Product.updateOne({ _id: request.body.machine }, { $pull: { machineConnections: { $in: connectionToMove } } });


    } catch (error) {
      console.error("Error in disconnectConnections:", error.message);
    }
  } else {
    console.info("No machine connections found to attach to transpher machine.");
  }
};

function updateConnectingMachine(req, transferredDate) {
  let data = {
    customer: req.body.customer,
    financialCompany: updateProperty(req, "financialCompany"),
    billingSite: updateProperty(req, "billingSite"),
    instalationSite: updateProperty(req, "instalationSite"),
    shippingDate: updateProperty(req, "shippingDate"),
    installationDate: updateProperty(req, "installationDate"),
    status: updateProperty(req, "status"),
    workOrderRef: updateProperty(req, "workOrderRef"),
    siteMilestone: updateProperty(req, "siteMilestone"),
    accountManager: updateProperty(req, "accountManager"),
    projectManager: updateProperty(req, "projectManager"),
    supportManager: updateProperty(req, "supportManager"),
    supportExpireDate: ""
  };
  if (transferredDate && transferredDate !== undefined) {
    data.purchaseDate = transferredDate
  }

  for (const key in data) {
    if (data[key] === '' || data[key] === undefined || data[key] === null) {
      data[key] = null;
    }
  }

  return data;
}

function updateProperty(req, property, defaultValue = "") {
  try {
    return req.body[property] && req.body[property] !== undefined ? req.body[property] : defaultValue;
  } catch (error) {
    return req.body[property] = undefined;
  }
}

function isNonTransferrableMachine(status) {
  if (!_.isEmpty(status) && status?.slug === 'transferred') {
    return true;
  }
  return false;
}

function createMachineAuditLogRequest(recordType, activityType, oldObject, newObject, loggedInUser) {
  const machineAuditLog = {
    body: {
      oldObject: oldObject,
      machine: (oldObject && oldObject?._id && ObjectId?.isValid(oldObject?._id)) ? oldObject?._id : newObject?._id,
      recordType: recordType,
      customer: (oldObject && oldObject?.customer && ObjectId?.isValid(oldObject?.customer)) ? oldObject?.customer : newObject?.customer,
      globelMachineID: newObject?.globelMachineID,
      activityType: activityType,
      newObject: newObject
    }
  };
  // switch (recordType) {
  //   case "CREAT":
  //     console.log("Record type is ABC");
  //     break;
  // }

  if (activityType === 'Transfer') {
    machineAuditLog.body.activitySummary = `Machine(ID:${newObject?._id}) owned by customer(ID:${newObject?.customer}) transferred by user(ID:${loggedInUser})`;
  } else {
    machineAuditLog.body.activitySummary = `Machine(ID:${newObject?._id}) ${activityType} by user(ID:${loggedInUser})`;
  }

  return machineAuditLog;
}



// TODO: SHOULD REMOVE FROM HERE AND SHOULD BE CENTERLIZED IN NEXT RELEASE.
async function applyUserFilter(req) {
  if (!req.query.unfiltered) {
    if (
      !req.body.loginUser?.roleTypes?.includes("SuperAdmin") &&
      req?.body?.userInfo?.dataAccessibilityLevel !== 'GLOBAL' &&
      !req.body.loginUser?.roleTypes?.includes("Developer")
    ) {
      let user = await SecurityUser.findById(req.body.loginUser.userId).select(
        'regions customers machines'
      ).lean();

      if (user) {
        let finalQuery = {
          $or: []
        };

        // region
        if (Array.isArray(user.regions) && user.regions.length > 0) {
          let regions = await Region.find({ _id: { $in: user.regions } }).select(
            'countries'
          ).lean();
          let countries = [];
          let countryNames = [];
          let customerSites = [];

          for (let region of regions) {
            if (Array.isArray(region.countries) && region.countries.length > 0)
              countries = [...region.countries];
          }

          if (Array.isArray(countries) && countries.length > 0) {
            let countriesDB = await Country.find({ _id: { $in: countries } }).select(
              'country_name'
            ).lean();

            if (Array.isArray(countriesDB) && countriesDB.length > 0)
              countryNames = countriesDB.map((c) => c.country_name);
          }

          console.log("***countryNames", countryNames);

          if (Array.isArray(countryNames) && countryNames.length > 0) {
            customerSitesDB = await CustomerSite.find(
              { "address.country": { $in: countryNames } }
            ).select('_id').lean();

            if (Array.isArray(customerSitesDB) && customerSitesDB.length > 0)
              customerSites = customerSitesDB.map((site) => site._id);
          }

          let mainSiteQuery = { $in: customerSites };
          finalQuery.$or.push({ mainSite: mainSiteQuery });
        }

        // customer
        if (Array.isArray(user.customers) && user.customers.length > 0) {
          let idQuery = { $in: user.customers };
          finalQuery.$or.push({ _id: idQuery });
        }

        //machine
        if (Array.isArray(user.machines) && user.machines.length > 0) {
          let listProducts = await Product.find({ _id: { $in: user.machines } }).select(
            'customer'
          ).lean();
          const listCustomers = listProducts.map((item) => item.customer);
          let idQuery = { $in: listCustomers };
          finalQuery.$or.push({ _id: idQuery });
        }

        // project, support and account manager query.
        if (req?.body?.userInfo?.contact) {
          const query___ = {
            $or: [
              { accountManager: req?.body?.userInfo?.contact },
              { projectManager: req?.body?.userInfo?.contact },
              { supportManager: req?.body?.userInfo?.contact }
            ]
          };
          let customerAllowed = await Customer.find(query___).select('_id').lean();

          if (customerAllowed && customerAllowed.length > 0) {
            finalQuery.$or.push({ _id: { $in: customerAllowed } });
          }

          // Allowed customer from machines.
          const productCustomers = await Product.find(query___).select('-_id customer').lean();
          const customerIds = productCustomers.map(customer => customer.customer);
          if (customerIds && customerIds.length > 0) {
            finalQuery.$or.push({ _id: { $in: customerIds } });
          }
        }

        if (finalQuery && finalQuery.$or.length > 0) {
          return finalQuery;
        } else {
          return null;
        }
      } else {
        return null;
      }
    }
  } else {
    delete req.query.unfiltered;
    return null;
  }
}

exports.getProductsSiteCoordinates = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};

  const queryString__ = await applyUserFilter(req);

  let customerQuery = { "excludeReports": { $ne: true }, isArchived: false };

  if (queryString__) {
    // Apply transformation to customerQuery based on queryString__
    customerQuery = { ...customerQuery, ...queryString__ };
  }

  console.log("log: customerQuery", customerQuery);
  let listCustomers = await Customer.find(customerQuery).select('_id').lean();
  let customerIds = listCustomers.map((c) => c._id);

  var installationSiteAggregate = ([
    {
      $match: {
        instalationSite: { $ne: null },
        isActive: true,
        isArchived: false,
        customer: { $in: customerIds },
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

exports.fetchMachineTransferHistory = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};
  if (req.query?.globelMachineID && req.query?.globelMachineID !== undefined) {
    const productLists = await Product.find({ globelMachineID: req.query.globelMachineID })
      .select('serialNo parentMachine parentSerialNo name transferredDate transferredToMachine transferredFromMachine status machineModel financialCompany customer instalationSite accountManager projectManager supportManager shippingDate installationDate')
      .populate(this.populate)
      .lean().sort({ _id: -1 });
    res.json(productLists);
  } else {
    return res.status(StatusCodes.BAD_REQUEST).send("globelMachineID not found");
  }
}

exports.checkDuplicateSerialNumber = async (req, res, machineid, returnResponse = true) => {
  this.query = req.query != "undefined" ? req.query : {};
  if (req.query?.serialNo && req.query?.serialNo !== undefined) {
    req.body.serialNo = req.query.serialNo;
  }

  if (!req.body || !req.body?.serialNo || req.body?.serialNo.trim().length == 0) {
    if (returnResponse) {
      return res.status(StatusCodes.BAD_REQUEST).json("No serialNo found")
    } else {
      return null;
    }
  }
  try {
    const regex = new RegExp('^' + req.body.serialNo.replace(/\s/g, ''), 'i');
    const queryString_ = { slug: 'transferred' };
    const listStatus = await ProductStatus.find(queryString_).select('_id').lean();
    let queryString = {
      serialNo: regex,
      isArchived: { $ne: true },
      status: { $nin: listStatus }
    };
    if (machineid && ObjectId.isValid(machineid)) {
      queryString._id = { $ne: machineid };
    }
    const ProductFound = await Product.findOne(queryString).select('_id').lean();
    if (ProductFound) {
      if (returnResponse) {
        return res.status(StatusCodes.BAD_REQUEST).json("The serialNo is already linked to a machine.");
      } else {
        return "The serialNo is already linked to a machine.";
      }
    } else {
      if (returnResponse) {
        return res.status(StatusCodes.ACCEPTED).json("No serialNo Found!");
      } else {
        return null;
      }
    }
  } catch (error) {
    console.error("Error checking serialNo:", error);
    if (returnResponse) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json("Internal Server Error");
    } else {
      return "Internal Server Error";
    }
  }
}

exports.moveMachine = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    try {
      if (ObjectId.isValid(req.body.machine) && ObjectId.isValid(req.body.customer)) {
        let existingMachine = await Product.findOne({ customer: req.body.customer, _id: req.body.machine, isActive: true, isArchived: false });
        if (existingMachine)
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Machine cannot be transferred to the same customer', true));
        let customer = await Customer.findOne({ _id: req.body.customer, isActive: true, isArchived: false });
        let machine = await Product.findOne({ _id: req.body.machine, isArchived: false, isActive: true });
        let installationSite;
        let billingSite;
        if (req.body.installationSite !== undefined && ObjectId.isValid(req.body.installationSite)) {
          installationSite = await CustomerSite.findOne({ _id: req.body.installationSite, isArchived: false, isActive: true });
        }

        if (req.body.billingSite !== undefined && ObjectId.isValid(req.body.billingSite)) {
          billingSite = await CustomerSite.findOne({ _id: req.body.billingSite, isArchived: false, isActive: true });
        }

        if (!customer)
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

    if (this.query.isArchived && this.query.isArchived === 'ALL') {
      delete this.query.isArchived;
    } else {
      this.query.isArchived = false;
    }

    let listCustomers = await Customer.find({ "excludeReports": { $ne: true } }).select('_id').lean();
    this.query.customer = { $in: listCustomers };

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
    let listProductServiceReports = await ProductServiceReports.aggregate(aggregate);
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
      let countlistProductServiceReports = listProductServiceReports.find((obj) => obj?._id?.toString() == product?._id?.toString());
      let countlistProductConfiguration = listProductConfiguration.find((obj) => obj?._id?.toString() == product?._id?.toString());

      let finalDataObj = null;

      let shippingDateLTZ = "";
      if (product?.shippingDate && product?.shippingDate.length > 0) { const shippingDate = new Date(product.shippingDate); shippingDateLTZ = shippingDate.toLocaleString('en-NZ', options); }

      let installationDateLTZ = "";
      if (product?.installationDate && product?.installationDate.length > 0) { const installationDate = new Date(product.installationDate); installationDateLTZ = installationDate.toLocaleString('en-NZ', options); }

      let SupportExpireDateLTZ = "";
      if (product?.SupportExpireDate && product?.SupportExpireDate.length > 0) { const SupportExpireDate = new Date(product.SupportExpireDate); SupportExpireDateLTZ = SupportExpireDate.toLocaleString('en-NZ', options); }


      if (EXPORT_UUID) {
        finalDataObj = {
          ProductID: "" + (product._id) + "",
          SerialNo: `${product?.serialNo?.replace(/"/g, "'")}`,
          Name: product?.name === undefined ? "" : (`${product?.name?.replace(/"/g, "'")}`),
          MachineModel: product?.machineModel?.name === undefined ? "" : (`${product?.machineModel?.name?.replace(/"/g, "'")}`),
          Supplier: product?.supplier?.name === undefined ? "" : (`${product?.supplier?.name?.replace(/"/g, "'")}`),
          Status: product?.status?.name === undefined ? "" : (`${product?.status?.name?.replace(/"/g, "'")}`),
          WorkOrderRef: product?.workOrderRef === undefined || !product?.workOrderRef ? "" : (`${product?.workOrderRef?.replace(/"/g, "'")}`),
          FinancialCompany: product?.financialCompany?.name === undefined ? "" : (`${product?.financialCompany?.name?.replace(/"/g, "'")}`),
          Customer: product?.customer?.name === undefined ? "" : (`${product?.customer?.name?.replace(/"/g, "'")}`),
          InstallationSite: product?.instalationSite?.name === undefined ? "" : (`${product?.instalationSite?.name?.replace(/"/g, "'")}`),
          InstallationSiteStreet: product?.instalationSite?.address?.street === undefined ? "" : (`${product?.instalationSite?.address?.street.replace(/"/g, "'")}`),
          InstallationSiteSuburb: product?.instalationSite?.address?.suburb === undefined ? "" : (`${product?.instalationSite?.address?.suburb.replace(/"/g, "'")}`),
          InstallationSiteCity: product?.instalationSite?.address?.city === undefined ? "" : (`${product?.instalationSite?.address?.city.replace(/"/g, "'")}`),
          InstallationSiteRegion: product?.instalationSite?.address?.region === undefined ? "" : (`${product?.instalationSite?.address?.region.replace(/"/g, "'")}`),
          InstallationSitePostcode: product?.instalationSite?.address?.postcode === undefined ? "" : (`${product?.instalationSite?.address?.postcode.replace(/"/g, "'")}`),
          InstallationSiteCountry: product?.instalationSite?.address?.country === undefined ? "" : (`${product?.instalationSite?.address?.country.replace(/"/g, "'")}`),
          InstallationSiteLatitude: product?.instalationSite?.lat === undefined ? "" : `${(product?.instalationSite?.lat?.replace(/"/g, "'"))}`,
          InstallationSiteLongitude: product?.instalationSite?.long === undefined ? "" : `${(product?.instalationSite?.long?.replace(/"/g, "'"))}`,
          BillingSite: product?.billingSite?.name === undefined ? "" : `${(product?.billingSite?.name?.replace(/"/g, "'"))}`,
          BillingSiteAddress: `${(fetchAddressCSV(product?.billingSite?.address)?.replace(/"/g, "'"))}`,
          BillingSiteCountry: product?.billingSite?.address?.country === undefined ? "" : (`${product?.billingSite?.address?.country.replace(/"/g, "'")}`),
          BillingSiteLatitude: product?.billingSite?.lat === undefined ? "" : `${(product?.billingSite?.lat?.replace(/"/g, "'"))}`,
          BillingSiteLongitude: product?.billingSite?.long === undefined ? "" : `${(product?.billingSite?.long?.replace(/"/g, "'"))}`,
          ShippingDate: shippingDateLTZ,
          InstallationDate: installationDateLTZ,
          SiteMilestone: product?.siteMilestone === undefined || !product?.siteMilestone ? "" : `${(product?.siteMilestone?.replace(/"/g, "'"))}`,
          AccountManager: product?.accountManager ? getContactName(product.accountManager) : "",
          ProjectManager: product?.projectManager ? getContactName(product.projectManager) : "",
          SupportManager: product?.supportManager ? getContactName(product.supportManager) : "",
          SupportExpireDate: SupportExpireDateLTZ,
          TotalSettings: `${(countlistProductTechParamValue != undefined ? countlistProductTechParamValue?.count : '')}`,
          TotalTools: `${(countlistProductToolInstalled != undefined ? countlistProductToolInstalled?.count : '')}`,
          TotalDrawings: `${(countlistProductDrawing != undefined ? countlistProductDrawing?.count : '')}`,
          TotalDocuments: `${(countlistDocument != undefined ? countlistDocument?.count : '')}`,
          TotalLicenses: `${(countlistProductLicense != undefined ? countlistProductLicense?.count : '')}`,
          TotalProfiles: `${(countlistProfileCount != undefined ? countlistProfileCount?.count : '')}`,
          TotalServiceReports: `${(countlistProductServiceReports != undefined ? countlistProductServiceReports?.count : '')}`,
          TotalINI: `${(countlistProductConfiguration != undefined ? countlistProductConfiguration?.count : '')}`,
        };
      } else {
        finalDataObj = {
          SerialNo: `${product?.serialNo?.replace(/"/g, "'")}`,
          Name: product?.name === undefined ? "" : (`${product?.name?.replace(/"/g, "'")}`),
          MachineModel: product?.machineModel?.name === undefined ? "" : (`${product?.machineModel?.name?.replace(/"/g, "'")}`),
          Supplier: product?.supplier?.name === undefined ? "" : (`${product?.supplier?.name?.replace(/"/g, "'")}`),
          Status: product?.status?.name === undefined ? "" : (`${product?.status?.name?.replace(/"/g, "'")}`),
          WorkOrderRef: product?.workOrderRef === undefined || !product?.workOrderRef ? "" : (`${product?.workOrderRef?.replace(/"/g, "'")}`),
          FinancialCompany: product?.financialCompany?.name === undefined ? "" : (`${product?.financialCompany?.name?.replace(/"/g, "'")}`),
          Customer: product?.customer?.name === undefined ? "" : (`${product?.customer?.name?.replace(/"/g, "'")}`),
          InstallationSite: product?.instalationSite?.name === undefined ? "" : (`${product?.instalationSite?.name?.replace(/"/g, "'")}`),
          InstallationSiteStreet: product?.instalationSite?.address?.street === undefined ? "" : (`${product?.instalationSite?.address?.street.replace(/"/g, "'")}`),
          InstallationSiteSuburb: product?.instalationSite?.address?.suburb === undefined ? "" : (`${product?.instalationSite?.address?.suburb.replace(/"/g, "'")}`),
          InstallationSiteCity: product?.instalationSite?.address?.city === undefined ? "" : (`${product?.instalationSite?.address?.city.replace(/"/g, "'")}`),
          InstallationSiteRegion: product?.instalationSite?.address?.region === undefined ? "" : (`${product?.instalationSite?.address?.region.replace(/"/g, "'")}`),
          InstallationSitePostcode: product?.instalationSite?.address?.postcode === undefined ? "" : (`${product?.instalationSite?.address?.postcode.replace(/"/g, "'")}`),
          InstallationSiteCountry: product?.instalationSite?.address?.country === undefined ? "" : (`${product?.instalationSite?.address?.country.replace(/"/g, "'")}`),
          InstallationSiteLatitude: product?.instalationSite?.lat === undefined ? "" : `${(product?.instalationSite?.lat?.replace(/"/g, "'"))}`,
          InstallationSiteLongitude: product?.instalationSite?.long === undefined ? "" : `${(product?.instalationSite?.long?.replace(/"/g, "'"))}`,
          BillingSite: product?.billingSite?.name === undefined ? "" : `${(product?.billingSite?.name?.replace(/"/g, "'"))}`,
          BillingSiteAddress: `${(fetchAddressCSV(product?.billingSite?.address)?.replace(/"/g, "'"))}`,
          BillingSiteCountry: product?.billingSite?.address?.country === undefined ? "" : (`${product?.billingSite?.address?.country.replace(/"/g, "'")}`),
          BillingSiteLatitude: product?.billingSite?.lat === undefined ? "" : `${(product?.billingSite?.lat?.replace(/"/g, "'"))}`,
          BillingSiteLongitude: product?.billingSite?.long === undefined ? "" : `${(product?.billingSite?.long?.replace(/"/g, "'"))}`,
          ShippingDate: shippingDateLTZ,
          InstallationDate: installationDateLTZ,
          SiteMilestone: product?.siteMilestone === undefined || !product?.siteMilestone ? "" : `${(product?.siteMilestone?.replace(/"/g, "'"))}`,
          AccountManager: product?.accountManager ? getContactName(product.accountManager) : "",
          ProjectManager: product?.projectManager ? getContactName(product.projectManager) : "",
          SupportManager: product?.supportManager ? getContactName(product.supportManager) : "",
          SupportExpireDate: SupportExpireDateLTZ,
          TotalSettings: `${(countlistProductTechParamValue != undefined ? countlistProductTechParamValue?.count : '')}`,
          TotalTools: `${(countlistProductToolInstalled != undefined ? countlistProductToolInstalled?.count : '')}`,
          TotalDrawings: `${(countlistProductDrawing != undefined ? countlistProductDrawing?.count : '')}`,
          TotalDocuments: `${(countlistDocument != undefined ? countlistDocument?.count : '')}`,
          TotalLicenses: `${(countlistProductLicense != undefined ? countlistProductLicense?.count : '')}`,
          TotalProfiles: `${(countlistProfileCount != undefined ? countlistProfileCount?.count : '')}`,
          TotalServiceReports: `${(countlistProductServiceReports != undefined ? countlistProductServiceReports?.count : '')}`,
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

exports.sendEmailAlert = async (req, data) => {
  const emailsSet = filterAndDeduplicateEmails(data?.managers)
  const emailsToSend = Array.from(emailsSet)
  let text = '';
  if (Array.isArray(emailsToSend) && emailsToSend?.length < 1) {
    return
  }

  if (data) {
    let params = {
      to: emailsToSend,
      toEmails: emailsToSend,
      subject: data?.subject,
      html: true
    };

    const customer = (!data?.transferredDate && data?.customer) ? `<strong>Customer:</strong> ${data?.customer} <br>` : '';
    const serialNo = `<a href="${process.env.ADMIN_PORTAL_APP_URL}/products/machines/${data?.machineId}/view" target="_blank" ><strong>${data?.serialNo}${data?.model ? ' - ' : ''}${data?.model || ''}</strong></a>`;
    const status = ((data?.transferred || data?.transferredDate) && data?.status) ? `<strong>Status:</strong> ${data?.status} <br>` : '';
    const previousStatus = data?.previousStatus ? `<strong>Previous Status:</strong> ${data?.previousStatus} <br>` : '';
    const billingSite = data?.billingSite ? `<strong>Billing Site:</strong> ${data?.billingSite} <br>` : '';
    const installationSite = data?.installationSite ? `<strong>Installation Site:</strong> ${data?.installationSite} <br>` : '';
    const connectedMachines = data?.connectedMachines ? `<strong>Connected Machines:</strong> ${data?.connectedMachines} <br>` : '';
    const manufactureDate = data?.manufactureDate ? `<strong>Manufacture Date: </strong> ${data?.manufactureDate} <br>` : '';
    const shippingDate = data?.shippingDate ? `<strong>Shipping Date: </strong> ${data?.shippingDate} <br>` : '';
    const decommissionedDate = data?.decommissionedDate ? `<strong>Decommissioned Date: </strong> ${data?.decommissionedDate} <br>` : '';
    const installationDate = data?.installationDate ? `<strong>Installation Date: </strong> ${data?.installationDate} <br>` : '';
    const transferredDate = data?.transferredDate ? `<strong>Transferred Date: </strong> ${data?.transferredDate} <br>` : '';

    if (data?.transferredDate) {
      text = `Machine ${serialNo} has been transferred from customer <strong>${data?.customer || ''}</strong>.`
    } else if (data?.transferred) {
      text = `Machine ${serialNo} has been transferred to customer <strong>${data?.customer || ''}</strong>.`
    } else {
      text = `Machine ${serialNo} status has been changed ${data?.previousStatus ? 'from' : ''} <strong>${data?.previousStatus || ''}</strong>  to <strong>${data?.status || ''}</strong>.`
    }

    const contentHTML = await fs.promises.readFile(path.join(__dirname, '../../email/templates/machine.html'), 'utf8');
    const content = render(contentHTML, {
      text,
      serialNo,
      // previousCustomer,
      customer,
      previousStatus,
      status,
      manufactureDate,
      shippingDate,
      connectedMachines,
      decommissionedDate,
      installationDate,
      installationSite,
      billingSite,
      transferredDate,
    });

    const htmlData = await renderEmail(params.subject, content)
    params.htmlData = htmlData;

    try {
      req.body = { ...req.body, ...params };
      req.body.machine = data?.machineId
      await this.email.sendEmail(req);
    } catch (e) {
      return e.message;
    }
  }
}


function fetchAddressCSV(address) {
  if (!address || typeof address !== 'object') {
    return ''; // Return an empty string or handle the error as needed
  }

  const addressComponents = ['street', 'suburb', 'city', 'region', 'postcode'];

  const formattedAddressCSV = addressComponents
    .map(component => address[component])
    .filter(value => value !== undefined && value !== null && value !== '')
    .join(', ');

  return formattedAddressCSV;
}

function getDocumentFromReq(req, reqType) {
  const { serialNo, name, generation, efficiency, parentMachine, parentSerialNo, globelMachineID, status, supplier, machineModel,
    workOrderRef, financialCompany, customer, instalationSite, billingSite, operators,
    accountManager, projectManager, supportManager, license, logo, siteMilestone,
    tools, description, internalTags, customerTags, manufactureDate, purchaseDate, transferredDate, installationDate, decommissionedDate, shippingDate, supportExpireDate,
    isActive, isArchived, loginUser, machineConnections, transferredFromMachine, alias } = req.body;


  let doc = {};
  if (reqType && reqType == "new") {
    doc = new Product({});
    doc.globelMachineID = doc._id;
  }

  if ("serialNo" in req.body) {
    doc.serialNo = serialNo;
  }
  if ("name" in req.body) {
    doc.name = name;
  }
  if ("generation" in req.body) {
    doc.generation = generation;
  }
  if ("efficiency" in req.body) {
    doc.efficiency = efficiency;
  }
  if ("parentMachine" in req.body) {
    doc.parentMachine = parentMachine;
  }
  if ("transferredFromMachine" in req.body) {
    doc.transferredFromMachine = transferredFromMachine;
  }
  if ("parentSerialNo" in req.body) {
    doc.parentSerialNo = parentSerialNo;
  }
  if ("globelMachineID" in req.body) {
    doc.globelMachineID = globelMachineID;
  }

  if ("status" in req.body) {
    doc.status = status;
  }
  if ("supplier" in req.body) {
    doc.supplier = supplier;
  }
  if ("machineModel" in req.body) {
    doc.machineModel = machineModel;
  }
  if ("workOrderRef" in req.body) {
    doc.workOrderRef = workOrderRef;
  }
  if ("financialCompany" in req.body) {
    doc.financialCompany = financialCompany;
  }
  if ("customer" in req.body) {
    doc.customer = customer;
  }
  if ("machineConnections" in req.body) {
    doc.machineConnections = machineConnections;
  }
  if ("instalationSite" in req.body) {
    doc.instalationSite = instalationSite;
  }
  if ("billingSite" in req.body) {
    doc.billingSite = billingSite;
  }
  if ("manufactureDate" in req.body) {
    doc.manufactureDate = manufactureDate;
  }
  if ("transferredDate" in req.body) {
    doc.transferredDate = transferredDate;
  }

  if ("purchaseDate" in req.body) {
    doc.purchaseDate = purchaseDate;
  }

  if ("installationDate" in req.body) {
    doc.installationDate = installationDate;
  }
  if ("decommissionedDate" in req.body) {
    doc.decommissionedDate = decommissionedDate;
  }

  if ("shippingDate" in req.body) {
    doc.shippingDate = shippingDate;
  }

  if ("supportExpireDate" in req.body) {
    doc.supportExpireDate = supportExpireDate;
  }

  if ("operators" in req.body) {
    doc.operators = operators;
  }
  if ("accountManager" in req.body) {
    doc.accountManager = accountManager;
  }
  if ("projectManager" in req.body) {
    doc.projectManager = projectManager;
  }
  if ("supportManager" in req.body) {
    doc.supportManager = supportManager;
  }
  if ("alias" in req.body) {
    doc.alias = alias;
  }


  if ("license" in req.body) {
    doc.license = license;
  }
  if ("logo" in req.body) {
    doc.logo = logo;
  }
  if ("tools" in req.body) {
    doc.tools = tools;
  }
  if ("internalTags" in req.body) {
    doc.internalTags = internalTags;
  }
  if ("customerTags" in req.body) {
    doc.customerTags = customerTags;
  }
  if ("description" in req.body) {
    doc.description = description;
  }
  if ("siteMilestone" in req.body) {
    doc.siteMilestone = siteMilestone;
  }
  if ("isActive" in req.body) {
    doc.isActive = isActive;
  }
  if ("isArchived" in req.body) {
    doc.isArchived = isArchived;
  }

  if (reqType == "new" && "loginUser" in req.body) {
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