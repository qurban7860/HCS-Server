const { StatusCodes } = require('http-status-codes');

var ObjectId = require('mongoose').Types.ObjectId;
let rtnMsg = require('../modules/config/static/static')


function checkParentID(parent, model) {
  return function (req, res, next) {
    if (!ObjectId.isValid(req.params[`${parent}Id`])) {
      return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordMissingParamsMessage(StatusCodes.BAD_REQUEST, parent));
    }
    else {
      const objID = new ObjectId(req.params[`${parent}Id`]);
      model.findOne({ _id: objID }).exec(function (err, record) {
        if (err) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
        }
        if (!record) {
          return res.status(StatusCodes.NOT_FOUND).send(rtnMsg.invalidIdMessage(StatusCodes.NOT_FOUND, parent));
        } else {
          next();
        }
      });
    }
  };
}

module.exports = checkParentID;