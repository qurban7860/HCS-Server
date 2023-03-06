const HttpError = require('../modules/config/models/http-error');
const { StatusCodes } = require('http-status-codes');
var ObjectId = require('mongoose').Types.ObjectId;
let rtnMsg = require('../modules/config/static/static')


function checkParentID(parent) {
  return function(req, res, next) {
    try{
      console.log('parent' ,`${parent}Id`);
      if(!ObjectId.isValid(req.params[`${parent}Id`])){
        return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordMissingParamsMessage(parent, StatusCodes.BAD_REQUEST));
      }
      next();
    }
    catch (err) {
      const error = new HttpError('Error in Middleware!', 403);
      return next(error);
    }
  }
}

module.exports = checkParentID;