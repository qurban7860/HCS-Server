const { validationResult } = require('express-validator');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
const { getDocFromReq } = require('../../../configs/reqDocService');
const logger = require('../../config/logger');
const { getToken } = require('../../../configs/getToken');
let rtnMsg = require('../../config/static/static');
let customerDBService = require('../services/customerDBService');
let ObjectId = require('mongoose').Types.ObjectId;
this.dbservice = new customerDBService();
const { PortalRegistration } = require('../models');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;
this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
    { path: 'createdBy', select: 'name' },
    { path: 'updatedBy', select: 'name' }
];

getRegisteredRequest = async (req, res, next) => {
    this.query = req.query != "undefined" ? req.query : {};
    if (!ObjectId.isValid(req.params.id))
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Please Provide a valid Registered Customer ID!");
    if (!req.body.loginUser)
        req.body.loginUser = await getToken(req);
    await this.dbservice.getObjectById( PortalRegistration, this.fields, req.params.id, this.populate, callbackFunc);
    async function callbackFunc(error, response) {
        if (error) {
            logger.error(new Error(error));
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
        } else {
            res.json(response);
        }
    }
};

exports.getRegisteredRequest = getRegisteredRequest;
exports.getRegisteredRequests = async (req, res, next) => {
    this.query = req.query != "undefined" ? req.query : {};
    this.orderBy = { createdAt: -1 };
    if (this.query.orderBy) {
        this.orderBy = this.query.orderBy;
        delete this.query.orderBy;
    }
    if (!req.body.loginUser)
        req.body.loginUser = await getToken(req);
    await this.dbservice.getObjectList(req, PortalRegistration, this.fields, this.query, this.orderBy, this.populateList, callbackFunc);
    function callbackFunc(error, response) {
        if (error) {
            logger.error(new Error(error));
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
        } else {
            res.json(response);
        }
    }
};

exports.postRegisterRequest = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } else {
        delete req.body?.internalRemarks;
        await this.dbservice.postObject(getDocFromReq(req, 'new', PortalRegistration ), callbackFunc);
        function callbackFunc(error, response) {
            if (error) {
                logger.error(new Error(error));
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
            } else {
                return res.status(StatusCodes.CREATED).json({ RegisteredRequest: response });
            }
        }
    }
};

exports.patchRegisteredRequest = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } else {
        if (!ObjectId.isValid(req.params.id))
            return  res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Please Provide a valid Registered Customer ID!");
        await this.dbservice.patchObject(PortalRegistration, req.params.id,getDocFromReq(req), callbackFunc);
        async function callbackFunc(error, response) {
            if (error) {
                logger.error(new Error(error));
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
            } else {
                await getRegisteredRequest(req, res);
            }
        }
    }
};

exports.deleteRegisteredRequest = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } else {
        if (!ObjectId.isValid(req.params.id))
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Please Provide a valid Registered Customer ID!");
        this.dbservice.deleteObject(PortalRegistration, req.params.id, res, callbackFunc);
        function callbackFunc(error, result) {
            if (error) {
                logger.error(new Error(error));
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
            }
            else {
                return res.status(StatusCodes.OK).send(rtnMsg.recordDelMessage(StatusCodes.OK, result));
            }
        }
    }
};