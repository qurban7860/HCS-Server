const HttpError = require('../modules/config/models/http-error');
const { StatusCodes } = require('http-status-codes');
const { Customer } = require('../modules/customers/models');
const { Machine } = require('../modules/machines/models');

var ObjectId = require('mongoose').Types.ObjectId;
let rtnMsg = require('../modules/config/static/static')


function checkParentID(parent, model){
  return async function(req, res, next) {
    try{
      if(!ObjectId.isValid(req.params[`${parent}Id`])){
        return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordMissingParamsMessage(StatusCodes.BAD_REQUEST, parent));
      }
      const objID = new ObjectId(req.params[`${parent}Id`]);
      await model.findOne({ _id: objID}).exec(function (err, record) {
        if (err) {
            console.log(err);
        } else {
          //  console.log('record', record);
           if(!record){
            // return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.invalidIdMessage(StatusCodes.BAD_REQUEST, parent));
           }
        }
      });
      next();
    }
    catch (err) {
      const error = new HttpError('Error in Middleware!', 403);
      return next(error);
    }
  }
}

module.exports = checkParentID;