const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const HttpError = require('../../config/models/http-error');
const logger = require('../../config/logger');
let rtnMsg = require('../../config/static/static');
const _ = require('lodash');
const { render } = require('template-file');
const fs = require('fs');
const awsService = require('../../../base/aws');
const { Config } = require('../../config/models');
const path = require('path');
const sharp = require('sharp');
const dayjs = require('dayjs');
const { customTimestamp } = require('../../../../utils/formatTime');
const { renderEmail } = require('../../email/utils');
const util = require('util');

let productDBService = require('../service/productDBService')
this.dbservice = new productDBService();
const emailController = require('../../email/controllers/emailController');
const { ProductServiceReports, ProductServiceReportFiles , ProductServiceReportValue, ProductServiceReportValueFile, Product, ProductModel, ProductCheckItem } = require('../models');
const { CustomerContact, Customer } = require('../../crm/models');
const { SecurityUser } = require('../../security/models');
const customerContact = require('../../crm/models/customerContact');
const getAllSPCustomerContacts = require('../../crm/utils/fetchAllSPContacts');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;

this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };   
//this.populate = 'category';
this.populate = [
  {path: 'serviceReportTemplate', select: 'reportTitle reportType'},
  {path: 'customer', select: 'name'},
  {path: 'site', select: 'name'},
  {path: 'machine', select: 'name serialNo'},
  {path: 'technician', select: 'firstName lastName'},
  {path: 'operators', select: 'firstName lastName'},
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];

this.populateObject = [
  {path: 'serviceReportTemplate', select: 'reportTitle reportType checkItemLists enableNote footer header enableMaintenanceRecommendations enableSuggestedSpares isOperatorSignatureRequired'},
  {path: 'customer', select: 'name'},
  {path: 'site', select: 'name'},
  {path: 'machine', select: 'name serialNo machineModel'},
  {path: 'technician', select: 'firstName lastName'},
  {path: 'operators', select: 'firstName lastName'},
  {path: 'createdBy', select: 'name'},
  {path: 'updatedBy', select: 'name'}
];

const getProductServiceReportData = async (req) => {
  try {
    const response = await this.dbservice.getObjectById(ProductServiceReports, this.fields, req.params.id, this.populateObject);
    
    if (!response) {
      throw new Error('Report not found');
    }
    
    let parsedResponse = JSON.parse(JSON.stringify(response));

    const queryToFindCurrentVer = { primaryServiceReportId: parsedResponse.primaryServiceReportId, isArchived: false, isHistory: false, status: 'SUBMITTED' };
    const currentVersion = await ProductServiceReports.findOne(queryToFindCurrentVer)
      .select('_id versionNo serviceDate primaryServiceReportId')
      .sort({ versionNo: -1 })
      .lean();
    
    parsedResponse.currentVersion = currentVersion;

    const completeEvaluationHistory = await ProductServiceReports.find({ primaryServiceReportId: parsedResponse.primaryServiceReportId })
      .select("versionNo approval.approvalLogs")
      .populate("approval.approvalLogs.evaluatedBy", "firstName lastName")
      .sort({ versionNo: -1 })
      .lean()
      .then(results => results.reduce((acc, item) => ({
        evaluationHistory: [...acc.evaluationHistory, {
          _id: item._id,
          versionNo: item.versionNo,
          logs: item.approval?.approvalLogs,
        }],
        totalLogsCount: acc.totalLogsCount + (item.approval?.approvalLogs?.length || 0),
      }), { evaluationHistory: [], totalLogsCount: 0 }));

    parsedResponse.completeEvaluationHistory = completeEvaluationHistory;

    if (parsedResponse && Array.isArray(parsedResponse.decoilers) && parsedResponse.decoilers.length > 0) {
      parsedResponse.decoilers = await Product.find({ _id: { $in: parsedResponse.decoilers }, isActive: true, isArchived: false });
    }

    if (parsedResponse.machine && parsedResponse.machine.machineModel) {
      parsedResponse.machine.machineModel = await ProductModel.findOne({ _id: parsedResponse.machine.machineModel }, { name: 1 });
    }

    if (Array.isArray(parsedResponse.operators) && parsedResponse.operators.length > 0) {
      parsedResponse.operators = await CustomerContact.find({ _id: { $in: parsedResponse.operators } }, { firstName: 1, lastName: 1 });
    }

    await ProductServiceReports.populate(parsedResponse, {
      path: 'approval.approvalLogs.evaluatedBy',
      select: 'firstName lastName',
    });

    const serviceReportFilesQuery = { primaryServiceReportId: { $in: parsedResponse.primaryServiceReportId }, isArchived: false, isReportDoc: false };
    const serviceReportDocsQuery = { primaryServiceReportId: { $in: parsedResponse.primaryServiceReportId }, isArchived: false, isReportDoc: true };

    let serviceReportFiles = await ProductServiceReportFiles.find(serviceReportFilesQuery)
      .select('name path extension fileType thumbnail isReportDoc').lean();

    let serviceReportDocs = await ProductServiceReportFiles.find(serviceReportDocsQuery)
      .select('name path extension fileType thumbnail isReportDoc').lean();

      if( req?.query?.isHighQuality ){
        serviceReportFiles = await Promise.all(
          serviceReportFiles.map(async ( file ) => await fetchFileFromAWS(file))
        );
        serviceReportDocs = await Promise.all(
          serviceReportDocs.map(async ( file ) => await fetchFileFromAWS(file))
        );
      }
      
    if (Array.isArray(serviceReportFiles) && serviceReportFiles.length > 0) {
      parsedResponse.files = serviceReportFiles;
    }

    if (Array.isArray(serviceReportDocs) && serviceReportDocs.length > 0) {
      parsedResponse.reportDocs = serviceReportDocs;
    }

    return parsedResponse;

  } catch (error) {
    logger.error(new Error(error));
    throw new Error(error);
  }
};

async function fetchFileFromAWS(file) {
  try {
    if (file.path && file.path !== '' && file._id) {
      const data = await awsService.fetchAWSFileInfo(file._id, file.path);
      
      const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/tiff',
        'image/gif',
        'image/svg+xml'
      ];

      const isImage = file?.fileType && allowedMimeTypes.includes(file.fileType);
      const fileSizeInMegabytes = ((data.ContentLength / 1024) / 1024);

      let updatedFile = { ...file }; 
      if (isImage ) {
        const fileBase64 = await awsService.processAWSFile(data);
        return updatedFile = { ...updatedFile, src: fileBase64 };
      } 
      return file
    } else {
      throw new Error("Invalid File Provided!");
    }
  } catch (e) {
    console.error("Error fetching file from AWS:", e.message);
    throw new Error(e);
  }
}

exports.getProductServiceReportData = getProductServiceReportData;

exports.getProductServiceReport = async (req, res, next) => {
  try {
    const data = await getProductServiceReportData(req);
    res.json(data);
  } catch (e) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

exports.getProductServiceReportWithIndividualDetails = async (req, res, next) => {

  this.dbservice.getObjectById(ProductServiceReports, this.fields, req.params.id, this.populateObject, callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {

      response = JSON.parse(JSON.stringify(response));

      if(response && Array.isArray(response.decoilers) && response.decoilers.length>0) {
        response.decoilers = await Product.find({_id:{$in:response.decoilers},isActive:true,isArchived:false});
      }
      
      if(Array.isArray(response.operators) && response.operators.length>0) {
        response.operators = await CustomerContact.find( { _id : { $in:response.operators } }, { firstName:1, lastName:1 });
      }

      // fetching active values.
      let listProductServiceReportValues = await ProductServiceReportValue.find({
        serviceReport: req.params.id,
        isArchived: false
      }, {checkItemValue: 1, comments: 1, serviceReport: 1, checkItemListId: 1, machineCheckItem: 1, createdBy: 1, createdAt: 1}).populate([{path: 'createdBy', select: 'name'}, {path: 'serviceReport', select: 'versionNo'}]);
      listProductServiceReportValues = JSON.parse(JSON.stringify(listProductServiceReportValues));     

      if(response.serviceReportTemplate && 
        Array.isArray(response.serviceReportTemplate.checkItemLists) &&
        response.serviceReportTemplate.checkItemLists.length>0) {
        let index = 0;
        for(let checkParam of response.serviceReportTemplate.checkItemLists) {
          if(Array.isArray(checkParam.checkItems) && checkParam.checkItems.length>0) {
            let indexP = 0;
            let productCheckItemObjects = await ProductCheckItem.find({_id:{$in:checkParam.checkItems}});
            productCheckItemObjects = JSON.parse(JSON.stringify(productCheckItemObjects));

            for(let paramListId of checkParam.checkItems) { 
              let productCheckItemObject = productCheckItemObjects.find((PCIO)=>paramListId.toString()==PCIO._id.toString());
              
              if(!productCheckItemObject)
                continue;
              
              let PSRV = listProductServiceReportValues.find((psrval)=>              
                psrval.machineCheckItem.toString() == paramListId && 
                psrval.checkItemListId.toString() == checkParam._id
              );

              if(PSRV) {
                productCheckItemObject.ReportValue = {
                  serviceReport : PSRV.serviceReport,
                  checkItemValue : PSRV.checkItemValue,
                  comments : PSRV.comments,
                  createdBy : PSRV.createdBy,
                  createdAt : PSRV.createdAt
                }
                productCheckItemObject.serviceReport = PSRV.serviceReport;                
                productCheckItemObject.checkItemValue = PSRV.checkItemValue;
                productCheckItemObject.comments = PSRV.comments;
                productCheckItemObject.createdBy = PSRV.createdBy;
                productCheckItemObject.createdAt = PSRV.createdAt;
              }

              response.serviceReportTemplate.checkItemLists[index].checkItems[indexP] = productCheckItemObject;
              indexP++;
            }
          }
          index++;
        }
      }
      let currentVersion_ = await ProductServiceReports.findOne(
      { primaryServiceReportId: response.primaryServiceReportId, isActive: true, isArchived: false, status:'SUBMITTED'}, 
      { versionNo: 1, _id: 1}).sort({_id: -1});
      currentVersion_ = JSON.parse(JSON.stringify(currentVersion_));     
      response.currentVersion = currentVersion_;
      res.json(response);
    }
  }
};


exports.getProductServiceReports = async (req, res, next) => {
  this.query = req.query != "undefined" ? req.query : {};  
  if(!mongoose.Types.ObjectId.isValid(req.params.machineId))
    return res.status(StatusCodes.BAD_REQUEST).send({message:"Invalid Machine ID"});
  this.query.machine = req.params.machineId;
  if(this.query.orderBy) {
    this.orderBy = this.query.orderBy;
    delete this.query.orderBy;
  }
  this.dbservice.getObjectList(req, ProductServiceReports, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
  async function callbackFunc(error, response) {
    if (error) {
      console.log("error", error);
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      if (response?.length === 0) res.json(response)
      else {
        const responseWithCurrentVersion = getCurrentVersionToProductServiceReports(response)
        res.json(responseWithCurrentVersion);
      }
    }
  }
};

const getCurrentVersionToProductServiceReports = (docServiceReportsList) => {
  const latestVersions = new Map();

  for (const report of docServiceReportsList) {
    const primaryServiceReportId = report.primaryServiceReportId.toString();
    const currentVersion = latestVersions.get(primaryServiceReportId);
    
    if (!currentVersion || report.versionNo > currentVersion.versionNo) {
      latestVersions.set(primaryServiceReportId, {
        versionNo: report.versionNo,
        _id: report._id,
        status: report.status
      });
    }
  }

  return docServiceReportsList.map(report => ({
    ...report.toObject(),
    currentVersion: latestVersions.get(report.primaryServiceReportId.toString())
  }));
};

exports.deleteProductServiceReport = async (req, res, next) => {
  try{
    req.body.isArchived = true;
    const serviceRecObj = await ProductServiceReports.findById( req.params.id ).select('status')
    if( serviceRecObj?.status?.toLowerCase() === 'draft'){
      await ProductServiceReportValue.updateMany( { serviceReport: req.params.id }, { $set: { isArchived: true } } );
      await ProductServiceReportValueFile.updateMany( { serviceReport: req.params.id }, { $set: { isArchived: true } } );
      await ProductServiceReportFiles.updateMany( { machineServiceReport: req.params.id }, { $set: { isArchived: true } } );
    }
      const result = await this.dbservice.deleteObject(ProductServiceReports, req.params.id, getDocumentFromReq(req), callbackFunc );
      function callbackFunc(error, result) {
        if (error) {
          logger.error(new Error(error));
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
        } else {
          res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
        }
      }
  } catch (error) {
    logger.error(new Error(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  } 

  this.dbservice.deleteObject(ProductServiceReports, req.params.id, res, callbackFunc);
  function callbackFunc(error, result) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    } else {
      res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
    }
  }
};

exports.postProductServiceReport = async (req, res, next) => {

  const errors = validationResult(req);

  if(!mongoose.Types.ObjectId.isValid(req.params.machineId)){
    return res.status(StatusCodes.BAD_REQUEST).send({message:"Invalid Machine ID"});
  }
  
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    
    if(!req.body.loginUser)
      req.body.loginUser = await getToken(req);
  }
  
  const machine = await Product.findById(req.params.machineId)
  
  let productServiceReportObject = await getDocumentFromReq(req, 'new');
  // productServiceReportObject.status = 'DRAFT';
  productServiceReportObject.serviceReportUID = `${machine?.serialNo || '' } - ${customTimestamp( new Date())?.toString()}`;
  productServiceReportObject.primaryServiceReportId = productServiceReportObject?._id;
  productServiceReportObject.customer = machine?.customer;

  this.dbservice.postObject(productServiceReportObject, callbackFunc);

  async function callbackFunc(error, response) {
    if (error) {
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
        error._message
      );
    } else {
      if(response && Array.isArray(response.decoilers) && response.decoilers.length>0) {
        response = JSON.parse(JSON.stringify(response));
        response.decoilers = await Product.find({_id:{$in:response.decoilers}});
      }

      req.machineServiceReport = response._id;
      req.machineId = req.params.machineId;

      // Pass control to the next middleware for file upload processing
      if (req.files && req.files.images) {
        return next(); 
      }
      res.status(StatusCodes.CREATED).json( response );
    }
  }
}


exports.newProductServiceReportVersion = async (req, res, next) => {
  try{
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    if(!mongoose.Types.ObjectId.isValid(req.params.machineId)){
      return res.status(StatusCodes.BAD_REQUEST).send("Invalid Machine ID");
    } 

    const machine = await Product.findById(req.params.machineId).populate([{ path: 'customer', populate: { path: 'mainSite'}}])
    if(!machine?._id){
      return res.status(StatusCodes.BAD_REQUEST).send("Invalid Machine ID");
    }

    const productServiceReport = await ProductServiceReports.findById(req.params.id);
    if(!productServiceReport?._id){
      return res.status(StatusCodes.BAD_REQUEST).send("Invalid Service Report ID");
    }
    if(!productServiceReport?.isActive){
      return res.status(StatusCodes.BAD_REQUEST).send("Service Report is not active!");
    }

    const findDraftServiceReport = await ProductServiceReports.findOne({
      primaryServiceReportId: productServiceReport?.primaryServiceReportId, status: 'DRAFT', isArchived: false
    }).populate( this.populateObject ).sort({ _id: -1 });
    
    if(findDraftServiceReport?._id){
      return res.status(StatusCodes.OK).json( findDraftServiceReport );
    }
    let productServiceReportObject = {};
    const parentProductServiceReportObject = await ProductServiceReports.findOne(
      { primaryServiceReportId: productServiceReport?.primaryServiceReportId, isActive: true, isArchived: false }
    ).sort({ _id: -1 });

    productServiceReportObject.primaryServiceReportId = parentProductServiceReportObject?.primaryServiceReportId || productServiceReport?.primaryServiceReportId;

    req.body.serviceReportTemplate = parentProductServiceReportObject?.serviceReportTemplate || null;
    req.body.serviceReportUID = parentProductServiceReportObject?.serviceReportUID;
    req.body.versionNo = parentProductServiceReportObject?.versionNo + 1;
    req.body.primaryServiceReportId = parentProductServiceReportObject?.primaryServiceReportId  || null;
    req.body.customer = machine?.customer?._id || null;
    req.body.site = machine?.customer?.mainSite?._id || null;
    req.body.status = 'DRAFT';
    req.body.machine = machine?._id || null;
    req.body.decoilers = parentProductServiceReportObject?.decoilers || [];
    req.body.operators = parentProductServiceReportObject?.operators || [];
    req.body.technician = parentProductServiceReportObject?.technician || null;
    req.body.operatorNotes = parentProductServiceReportObject?.operatorNotes || '';
    req.body.technicianNotes = parentProductServiceReportObject?.technicianNotes || '';
    req.body.textBeforeCheckItems = parentProductServiceReportObject?.textBeforeCheckItems || '';
    req.body.textAfterCheckItems = parentProductServiceReportObject?.textAfterCheckItems || '';
    req.body.internalComments = parentProductServiceReportObject?.internalComments || '';
    req.body.internalNote = parentProductServiceReportObject?.internalNote || '';
    req.body.recommendationNote = parentProductServiceReportObject?.recommendationNote || '';
    req.body.serviceNote = parentProductServiceReportObject?.serviceNote || '';
    req.body.suggestedSpares = parentProductServiceReportObject?.suggestedSpares || '';
    req.body.isHistory = false;

    productServiceReportObject = getDocumentFromReq(req, 'new');
    const result = await productServiceReportObject.save();
    // await historyServiceReportValues( parentProductServiceReportObject?.primaryServiceReportId );
    const serviceReportFileQuery = { primaryServiceReportId:{ $in: parentProductServiceReportObject?.primaryServiceReportId }, isArchived: false };
    let serviceReportFiles = await ProductServiceReportFiles.find(serviceReportFileQuery).select('name path extension fileType thumbnail');
    if( Array.isArray(serviceReportFiles) && serviceReportFiles?.length > 0 ){
      result.files = serviceReportFiles;
    }
    return res.status(StatusCodes.OK).json(result);
  }catch(err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("New version create failed!"); 
  }
}


exports.sendServiceReportEmail = async (req, res, next) => {
  const errors = validationResult(req);
  var _this = this;
  if (!errors.isEmpty()) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST)); 
  } else {
    const file_ = req.file;
    const emailAddress = req.body.email;
    if (!file_) {
      return res.status(400).send('No file uploaded!');
    };

    if (!validateEmail(emailAddress)) {
      return res.status(400).send('Email validation failed!');
    }

    const serviceRecObj = await ProductServiceReports.findOne({ _id: req.params.id, isActive: true, isArchived: false })
      .populate([{ path: 'customer', select: 'name'}, { path: 'machine', select: 'serialNo'}, { path: 'createdBy', select: 'name'}]);

    if (serviceRecObj) {
      let emailSubject = `Service Report PDF attached`;

      let params = {
        to: emailAddress,
        subject: emailSubject,
        html: true,
      };
      
      const readFileAsync = util.promisify(fs.readFile);
      try {
        const data = await readFileAsync(file_.path);
        file_.buffer = data;
      } catch (err) {
        console.error('Error reading file:', err);
      }
      
      const username = serviceRecObj.name;
      const SDdateObject = new Date( serviceRecObj.serviceDate );
      const SDmonth = SDdateObject.getMonth() + 1;
      const SDday = SDdateObject.getDate();
      const serviceDate = `${SDdateObject.getFullYear()}-${(SDmonth) < 10 ? '0' : ''}${SDmonth}-${SDday < 10 ? '0' : ''}${SDday}`;
      const versionNo=serviceRecObj.versionNo;
      const serviceReportId=serviceRecObj.serviceReportUID
      const serialNo=serviceRecObj.machine?.serialNo;
      const customer=serviceRecObj.customer?.name;
      const createdBy=serviceRecObj.createdBy?.name;

      let createdAt=serviceRecObj.createdAt;
      const dateObject = new Date(createdAt);
      const year = dateObject.getFullYear();
      const month = dateObject.getMonth() + 1;
      const day = dateObject.getDate();
      createdAt = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
      
      const contentHTML = await fs.promises.readFile(path.join(__dirname, '../../email/templates/serviceReport.html'), 'utf8');
      const content = render(contentHTML, { username, serviceDate, serviceReportId, versionNo, serialNo, customer, createdAt, createdBy });
      const htmlData =  await renderEmail(emailSubject, content )
      params.htmlData = htmlData;
      try {
        await awsService.sendEmailWithRawData(params, file_);
      } catch(e) {
        res.status(StatusCodes.OK).send('Email Send Fails!');
      }

      const emailResponse = await addEmail(params.subject, params.htmlData, serviceRecObj, params.to);
      _this.dbservice.postObject(emailResponse, callbackFunc);
      function callbackFunc(error, response) {
        if (error) {
          logger.error(new Error(error));
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
        } else {
          res.status(StatusCodes.OK).send(rtnMsg.recordCustomMessageJSON(StatusCodes.OK, 'Email sent successfully!', false));
        }
      }
    } else {
      res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Service Report template not found!', true));
    }
  }
};

exports.sendServiceReportApprovalEmail = async (req, res, next) => {
  const errors = validationResult(req);
  var _this = this;
  const approvingContacts = req.body?.approvingContacts;
  const machineId = req.params.machineId;
  const reportId = req.params.id;
  if (!errors.isEmpty() || approvingContacts?.length === 0) {
    res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  } else {
    const serviceRecObj = await ProductServiceReports.findOne({ _id: req.params.id, isActive: true, isArchived: false }).populate([
      { path: "customer", select: "name" },
      { path: "machine", select: "serialNo" },
      { path: "createdBy", select: "name" },
    ]);

    if (serviceRecObj) {
      let emailSubject = `Service Report Approval Request`;
      const submittedBy = req.body.submittedBy?.displayName;
      const submittedAt = dayjs(req.body.submittedAt).format("DD MMM YYYY h:mm A");
      const serviceDate = dayjs(serviceRecObj.serviceDate).format("DD MMM YYYY h:mm A");
      const versionNo = serviceRecObj.versionNo;
      const serviceReportId = serviceRecObj.serviceReportUID;
      const serialNo = serviceRecObj.machine?.serialNo;
      const customer = serviceRecObj.customer?.name;
      const viewServiceReportUrl = `${process.env.CLIENT_APP_URL || "https://admin.portal.howickltd.com/"}products/machines/${machineId}/serviceReports/${reportId}/view`;

      const contentHTML = await fs.promises.readFile(path.join(__dirname, "../../email/templates/serviceReportApproval.html"), "utf8");

      const sendEmailForApproval = async (contact) => {
        try {
          const approvalOfficer = `${contact?.firstName} ${contact?.lastName}`;
          const content = render(contentHTML, { approvalOfficer, serviceDate, serviceReportId, versionNo, serialNo, customer, submittedBy, submittedAt, viewServiceReportUrl });
          const htmlData = await renderEmail(emailSubject, content);
          let params = {
            to: contact?.email,
            subject: emailSubject,
            html: true,
            htmlData: htmlData,
          };

          await awsService.sendEmail(params);
          await ProductServiceReports.findByIdAndUpdate(
            reportId,
            {
              $addToSet: {
                "approval.approvingContacts": contact._id,
              },
            },
            { new: true }
          );
          return { success: true, emailData: { subject: params.subject, htmlData: params.htmlData, to: params.to } };
        } catch (emailError) {
          console.error("Error sending email:", emailError);
          return { success: false, emailData: null };
        }
      };

      try {
        const results = await Promise.all(approvingContacts.map(sendEmailForApproval));
        const allEmailsSent = results.every((result) => result.success);

        if (allEmailsSent) {
          const serviceReportData = await getProductServiceReportData( req )
          res.status(StatusCodes.OK).send(serviceReportData);
        } else {
          res.status(StatusCodes.BAD_REQUEST).send("Some emails failed to send.");
        }

        // Attempt logging after sending emails
        for (const result of results) {
          if (result.success && result.emailData) {
            try {
              const { subject, htmlData, to } = result.emailData;
              const emailResponse = await addEmail(subject, htmlData, serviceRecObj, to);
              _this.dbservice.postObject(emailResponse);
              logger.info(`[${subject}] to [${to}] email logged`);
            } catch (logError) {
              console.error("Error logging email:", logError);
              logger.error(new Error(error));
            }
          }
        }
      } catch (e) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
      }
    } else {
      res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, "Service Report template not found!", true));
    }
  }
};

exports.evaluateServiceReport = async (req, res, next) => {
  const errors = validationResult(req);
  const evaluationData = req.body?.evaluationData;
  let reqError = true;

  const productServiceReport = await ProductServiceReports.findById(req.params.id);

  const evaluationUserEmail = await customerContact.findById(evaluationData.evaluatedBy, "email");
  const contactsWithApproval = await Config.findOne({
    name: "Approving_Contacts",
  });

  const spCustomerContacts = await getAllSPCustomerContacts()

  if (
    productServiceReport?.approval?.approvingContacts?.length > 0 &&
    productServiceReport?.approval?.approvingContacts?.includes(evaluationData?.evaluatedBy) &&
    (contactsWithApproval?.value?.toLowerCase().includes(evaluationUserEmail?.email.toLowerCase()) ||
      spCustomerContacts.some((contact) => contact.email.toLowerCase() === evaluationUserEmail?.email.toLowerCase()))
  ) {
    reqError = false;
  }

  if (!errors.isEmpty() || reqError) {
    return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
  }

  if (productServiceReport) {
    await productServiceReport.addApprovalLog({ ...evaluationData });
    const response = await getProductServiceReportData( req )
    res.status(StatusCodes.OK).send(response);
  } else {
    res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, "Service Report template not found!", true));
  }
};

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function addEmail(subject, body, toUser, emailAddresses, fromEmail='', ccEmails = [],bccEmails = []) {
  var email = {
    subject,
    body,
    toEmails:emailAddresses,
    fromEmail:process.env.AWS_SES_FROM_EMAIL,
    customer:'',
    toContacts:[],
    toUsers:[],
    ccEmails,
    bccEmails,
    isArchived: false,
    isActive: true,
    // loginIP: ip,
    createdBy: '',
    updatedBy: '',
    createdIP: ''
  };
  if(toUser && mongoose.Types.ObjectId.isValid(toUser.id)) {
    email.toUsers.push(toUser.id);
    if(toUser.customer != null && toUser.customer != "undefined" && toUser.customer.id && mongoose.Types.ObjectId.isValid(toUser.customer.id)) {
      email.customer = toUser.customer.id;
    } else {
      email.customer = null;
    }

    if(toUser.contact != null && toUser.contact != undefined && toUser.contact && mongoose.Types.ObjectId.isValid(toUser.contact.id)) {
      email.toContacts.push(toUser.contact.id);
    } else {
      email.toContacts = null;
    }
  }
  
  var reqEmail = {};

  reqEmail.body = email;
  
  const res = emailController.getDocumentFromReq(reqEmail, 'new');
  return res;
}

exports.patchProductServiceReport = async (req, res ) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty() || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    if (!req.body.loginUser) {
      req.body.loginUser = await getToken(req);
    }

    const findServiceReport = await ProductServiceReports.findById(req.params.id);
    if (!findServiceReport) {
      return res.status(StatusCodes.NOT_FOUND).send('Service Report not found');
    }

    if (req.body.isArchived === true) {
      await handleArchive(req, res);
      return;
    }

    req.body.primaryServiceReportId = findServiceReport?.primaryServiceReportId;

    if (req.body.status?.toLowerCase() === 'draft') {
      await checkDraftServiceReports(req, res, findServiceReport)
      await handleDraftStatus(req, res, findServiceReport);
      return;
    }

    await handleSubmitStatus(req, res, findServiceReport);
  } catch (error) {
    logger.error(new Error(error));
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
}

const handleArchive = async (req, res) => {
  try {
    var _this = this;
    await _this.dbservice.patchObject(ProductServiceReports, req.params.id, getDocumentFromReq(req));
    return res.status(StatusCodes.ACCEPTED).send('Service Report Archived Successfully!');
  } catch (error) {
      console.log(error);
      return res.status(StatusCodes.BAD_REQUEST).send('Service Report Archived failed!');
  }
}

const checkDraftServiceReports = async ( req, res, findServiceReport ) => {
  const findServiceReports = await ProductServiceReports.find({
    primaryServiceReportId: findServiceReport?.primaryServiceReportId,
    status: 'DRAFT'
  }).sort({ _id: -1 });
  if (Array.isArray(findServiceReports) && (findServiceReports.length > 0 && !findServiceReports?.some((fsr) => fsr?._id == req.params.id))) {
    return res.status(StatusCodes.BAD_REQUEST).send('Service Report is already in Draft!');
  } 
}

const handleDraftStatus = async (req, res, findServiceReport) =>{
  try{
    var _this = this;
      try {
        await checkDraftServiceReports( req, res, findServiceReport)
        await _this.dbservice.patchObject(ProductServiceReports, req.params.id, getDocumentFromReq(req));
        const response = await getProductServiceReportData( req );
        return res.status(StatusCodes.OK).send(response);
      } catch (e) {
        console.log(e);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Service Report updated failed!');
      }
  } catch(e){
    console.log(e);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordUpdateMessage(StatusCodes.INTERNAL_SERVER_ERROR));
  }
}

const handleSubmitStatus = async (req, res, findServiceReport) => {
  try{
    
    let productServiceReportObject = {};
    productServiceReportObject.primaryServiceReportId =  req.body.primaryServiceReportId;
      delete req.body.versionNo;
      productServiceReportObject = await getDocumentFromReq(req);
      await ProductServiceReports.updateOne({ _id: req.params.id }, productServiceReportObject )
      if( req.body?.status?.toLowerCase() === 'submitted' ){
        await handleSubmitServiceReports( req );
      }
      if( req.body?.status?.toLowerCase() === 'approved' ){
        return res.status(StatusCodes.OK).send('Approval email sent successfully!');
      }
      const data = await getProductServiceReportData(req);
      return res.status(StatusCodes.OK).send(data);
  } catch(e) {
    console.log(e);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordUpdateMessage(StatusCodes.INTERNAL_SERVER_ERROR));
  }
}

async function handleSubmitServiceReports( req ) {
  try{
      const queryToUpdateReports = {
        primaryServiceReportId: req.body.primaryServiceReportId,
        machine: req.params.machineId,
      _id: { $ne: req.params.id },
    };
    await historyServiceReportValues( req );
    await ProductServiceReports.updateMany(queryToUpdateReports, { $set: { isHistory: true } });

    return;
  } catch (e) {
    console.log(e);
    throw new Error('Update previous service reports Failed!');
  }
}

async function historyServiceReportValues( req ) {
  try{

    const draftServiceReportValues = await ProductServiceReportValue.find({ serviceReport: req.params.id }).lean();

    if( Array.isArray( draftServiceReportValues ) && draftServiceReportValues?.length > 0 ){

      const conditions = draftServiceReportValues?.map(pair => ({
        machineCheckItem: pair.machineCheckItem,
        checkItemListId: pair.checkItemListId,
        primaryServiceReportId: req.body.primaryServiceReportId,
        serviceReport: { $ne: req.params.id }
      }));
      
      await ProductServiceReportValue.updateMany(
        { $or: conditions },
        { $set: { isHistory: true } }
      );
    }
    return;
  } catch (e) {
    console.log(e);
    throw new Error('Update service report Values failed!');
  }
}

async function getToken(req){
  try {
    const token = req && req.headers && req.headers.authorization ? req.headers.authorization.split(' ')[1]:'';
    const decodedToken = await jwt.verify(token, process.env.JWT_SECRETKEY);
    const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
    decodedToken.userIP = clientIP;
    return decodedToken;
  } catch (error) {
    throw new Error('Token verification failed');
  }
}

function getDocumentFromReq(req, reqType){
  const { 
    serviceReportTemplate, serviceReportUID, primaryServiceReportId, serviceDate, status, versionNo, customer, site, 
    technician, params, additionalParams, machineMetreageParams, punchCyclesParams, isReportDocsOnly,
    serviceNote, recommendationNote, internalComments, checkItemLists, suggestedSpares, internalNote, operators, operatorNotes,
    technicianNotes, decoilers, textBeforeCheckItems, textAfterCheckItems, isHistory, loginUser, isActive, isArchived
  } = req.body;
  
  let doc = {};

  if (reqType && reqType == "new"){
    doc = new ProductServiceReports({});
  }

  if ("serviceReportTemplate" in req.body){
    doc.serviceReportTemplate = serviceReportTemplate;
  }

  if ("serviceReportUID" in req.body){
    doc.serviceReportUID = serviceReportUID;
  }

  if ("customer" in req.body){
    doc.customer = customer;
  }

  if ("primaryServiceReportId" in req.body){
    doc.primaryServiceReportId = primaryServiceReportId;
  }
  
  if ("versionNo" in req.body){
    doc.versionNo = versionNo;
  }
  
  if ("site" in req.body){
    doc.site = site;
  }

  if (req.params.machineId){
    doc.machine = req.params.machineId;
  }

  if ("decoilers" in req.body){
    doc.decoilers = decoilers;
  }

  if ("technician" in req.body){
    doc.technician = technician;
  }

  if ("params" in req.body){
    doc.params = params;
  }

  if ("additionalParams" in req.body){
    doc.additionalParams = additionalParams;
  }

  if ("machineMetreageParams" in req.body){
    doc.machineMetreageParams = machineMetreageParams;
  }

  if ("punchCyclesParams" in req.body){
    doc.punchCyclesParams = punchCyclesParams;
  }

  if ("checkItemLists" in req.body){
    doc.checkItemLists = checkItemLists;
  }

  if ("serviceNote" in req.body){
    doc.serviceNote = serviceNote;
  }

  if ("serviceDate" in req.body){
    doc.serviceDate = serviceDate;
  }

  if ("recommendationNote" in req.body){
    doc.recommendationNote = recommendationNote;
  }

  if ("internalComments" in req.body){
    doc.internalComments = internalComments;
  }

  if ("suggestedSpares" in req.body){
    doc.suggestedSpares = suggestedSpares;
  }

  if ("internalNote" in req.body){
    doc.internalNote = internalNote;
  }

  if ("operators" in req.body){
    doc.operators = operators;
  }

  if ("operatorNotes" in req.body){
    doc.operatorNotes = operatorNotes;
  }

  if ("technicianNotes" in req.body){
    doc.technicianNotes = technicianNotes;
  }

  if ("textBeforeCheckItems" in req.body){
    doc.textBeforeCheckItems = textBeforeCheckItems;
  }
  
  if ("textAfterCheckItems" in req.body){
    doc.textAfterCheckItems = textAfterCheckItems;
  }

  if("isReportDocsOnly" in req.body ){
    doc.isReportDocsOnly = isReportDocsOnly;
  }

  if ("isHistory" in req.body){
    doc.isHistory = isHistory;
  }

  if ("isActive" in req.body){
    doc.isActive = isActive;
  }
  
  if ("isArchived" in req.body){
    doc.isArchived = isArchived;
  }

  if ("status" in req.body){
    doc.status = status;
  }
  
  if (reqType == "new" && "loginUser" in req.body ){
    doc.createdBy = loginUser.userId;
    doc.updatedBy = loginUser.userId;
    doc.createdIP = loginUser.userIP;
    doc.updatedIP = loginUser.userIP;
  } else if ("loginUser" in req.body) {
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
  } 

  return doc;

}


function productServiceReportValueDocumentFromReq(reportValue, reqType){
  const { serviceReport, primaryServiceReportId, machineCheckItem, checkItemListId, checkItemValue, versionNo, comments, files , isHistory, isActive, isArchived } = reportValue;
  const { loginUser } = reportValue;


  let doc = {};
  if (reqType && reqType == "new"){
    doc = new ProductServiceReportValue({});
  }

  if ("serviceReport" in reportValue) {
    doc.serviceReport = serviceReport;
  }

  if ("versionNo" in reportValue) {
    doc.versionNo = versionNo;
  }

  if ("primaryServiceReportId" in reportValue) {
    doc.primaryServiceReportId = primaryServiceReportId;
  }

  if ("machineCheckItem" in reportValue) {
    doc.machineCheckItem = machineCheckItem;
  }
  
  if ("checkItemListId" in reportValue) {
    doc.checkItemListId = checkItemListId;
  }
  
  if ("checkItemValue" in reportValue) {
    doc.checkItemValue = checkItemValue;
  }
  
  if ("comments" in reportValue) {
    doc.comments = comments;
  }
  
  if ("files" in reportValue) {
    doc.files = files;
  }

  if ("isHistory" in reportValue){
    doc.isHistory = isHistory;
  }
  
  if ("isActive" in reportValue){
    doc.isActive = isActive;
  }
  
  if ("isArchived" in reportValue){
    doc.isArchived = isArchived;
  }

  if (reqType == "new" && "loginUser" in reportValue ){
    doc.createdBy = loginUser.userId;
    doc.updatedBy = loginUser.userId;
    doc.createdIP = loginUser.userIP;
    doc.updatedIP = loginUser.userIP;
  } else if ("loginUser" in reportValue) {
    doc.updatedBy = loginUser.userId;
    doc.updatedIP = loginUser.userIP;
  } 

  return doc;
}
