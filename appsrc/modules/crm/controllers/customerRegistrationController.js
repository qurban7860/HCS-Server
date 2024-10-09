const { validationResult } = require('express-validator');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const { getDocumentFromReq } = require('../requestBodyValidation/customerRegistration');
const logger = require('../../config/logger');
const { getToken } = require('../../../configs/getToken');
let rtnMsg = require('../../config/static/static');
let customerDBService = require('../services/customerDBService');
let ObjectId = require('mongoose').Types.ObjectId;
this.dbservice = new customerDBService();
const { CustomerRegistration } = require('../models');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;
this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [];

getRegisteredCustomer = async (req, res, next) => {
    this.query = req.query != "undefined" ? req.query : {};
    if (!ObjectId.isValid(req.params.id))
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Please Provide a valid Registered Customer ID!");
    if (!req.body.loginUser)
        req.body.loginUser = await getToken(req);
    await this.dbservice.getObjectById( CustomerRegistration, this.fields, req.params.id, this.populate, callbackFunc);
    async function callbackFunc(error, response) {
        if (error) {
            logger.error(new Error(error));
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
        } else {
            res.json(response);
        }
    }
};

exports.getRegisteredCustomer = getRegisteredCustomer;
exports.getRegisteredCustomers = async (req, res, next) => {
    this.query = req.query != "undefined" ? req.query : {};
    this.orderBy = { createdAt: -1 };
    if (this.query.orderBy) {
        this.orderBy = this.query.orderBy;
        delete this.query.orderBy;
    }
    if (!req.body.loginUser)
        req.body.loginUser = await getToken(req);
    await this.dbservice.getObjectList(req, CustomerRegistration, this.fields, this.query, this.orderBy, this.populateList, callbackFunc);
    function callbackFunc(error, response) {
        if (error) {
            logger.error(new Error(error));
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
        } else {
            res.json(response);
        }
    }
};

exports.postRegisterCustomer = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } else {
        await this.dbservice.postObject(getDocumentFromReq(req, 'new'), callbackFunc);
        function callbackFunc(error, response) {
            if (error) {
                logger.error(new Error(error));
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
            } else {
                res.status(StatusCodes.CREATED).json({ RegisteredCustomer: response });
            }
        }
    }
};

exports.patchRegisteredCustomer = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } else {
        if (!ObjectId.isValid(req.params.id))
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Please Provide a valid Registered Customer ID!");
        await this.dbservice.patchObject(CustomerRegistration, req.params.id,getDocumentFromReq(req), callbackFunc);
        async function callbackFunc(error, response) {
            if (error) {
                logger.error(new Error(error));
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
            } else {
                await getRegisteredCustomer(req, res);
            }
        }
    }
};

exports.deleteRegisteredCustomer = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } else {
        if (!ObjectId.isValid(req.params.id))
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Please Provide a valid Registered Customer ID!");
        this.dbservice.deleteObject(CustomerRegistration, req.params.id, res, callbackFunc);
        function callbackFunc(error, result) {
            if (error) {
                logger.error(new Error(error));
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
            }
            else {
                res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
            }
        }
    }
};