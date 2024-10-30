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
const { postSecurityUser } = require('../../security/controllers/securityUserController');

this.debug = process.env.LOG_TO_CONSOLE != null && process.env.LOG_TO_CONSOLE != undefined ? process.env.LOG_TO_CONSOLE : false;
this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
    { path: 'customer', select: 'name' },
    { path: 'contact', select: 'firstName lastName' },
    { path: 'createdBy', select: 'name' },
    { path: 'updatedBy', select: 'name' }
];

const getPortalRequest = async( req, res ) => {
    this.query = req.query != "undefined" ? req.query : {};
    if (!ObjectId.isValid(req.params.id))
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Please Provide a valid Request ID!");
    await this.dbservice.getObjectById( PortalRegistration, this.fields, req.params.id, this.populate, callbackFunc);
    async function callbackFunc(error, response) {
        if (error) {
            logger.error(new Error(error));
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
        } else {
            return res.json(response);
        }
    }
}

getRegisteredRequest = async (req, res) => {
    try{
        await getPortalRequest( req, res )
    } catch( err ){
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
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
    await this.dbservice.getObjectList(req, PortalRegistration, this.fields, this.query, this.orderBy, this.populate, callbackFunc);
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
        async function callbackFunc(error, response) {
            if (error) {
                logger.error(new Error(error));
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
            } else {
                req.params.id = response?._id;
                await getPortalRequest(req, res)
            }
        }
    }
};

exports.patchRegisteredRequest = async (req, res, next) => {
    try{
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
        } else {
            if (!ObjectId.isValid(req.params.id)){
                return  res.status(StatusCodes.BAD_REQUEST).send("Please Provide a valid Request ID!");
            }
            const findRequest= await PortalRegistration.findById(req.params.id)
            if(findRequest?.status === 'APPROVED'){
                return  res.status(StatusCodes.BAD_REQUEST).send("APPROVED request can not be updated!");
            }
            const response = await this.dbservice.patchObject(PortalRegistration, req.params.id,getDocFromReq(req));

                const { contactPersonName, email, phoneNumber, roles, customer,contact } = req?.body;
                if( response && req?.body?.status === 'APPROVED' && contactPersonName && email && roles && customer && contact ){
                    const newUser = {
                        name: contactPersonName,
                        login: email,
                        email,
                        phone: phoneNumber,
                        password: '',
                        roles,
                        customer,
                        contact,
                        isInvite: true,
                        isNoReturn: true,
                    }
                    req.body = { ...req.body, ...newUser };
                    try {
                        await postSecurityUser(req);
                    } catch (error) {
                        return res.status(StatusCodes.CONFLICT).send(error.message);
                    }
                }
                await getPortalRequest(req, res);
            }
    } catch(error){
        logger.error(new Error(error));
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error?.message || "Portal Request update failed!");
    }
};

exports.deleteRegisteredRequest = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).send(getReasonPhrase(StatusCodes.BAD_REQUEST));
    } else {
        if (!ObjectId.isValid(req.params.id))
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Please Provide a valid Request ID!");
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