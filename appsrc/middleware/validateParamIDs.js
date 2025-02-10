const { StatusCodes } = require('http-status-codes');
const { Types: { ObjectId } } = require('mongoose');
const rtnMsg = require('../modules/config/static/static');

function validateParamIDs( validations ) {
  return async function (req, res, next) {
    try {
      for (const { param = '', model = null } of validations) {
        const paramId = req.params[param];

        if (!paramId || !ObjectId.isValid(paramId)) {
          return res.status(StatusCodes.BAD_REQUEST).send(
            rtnMsg.recordMissingParamsMessage(StatusCodes.BAD_REQUEST, paramId)
          );
        }

        if(model){
          const objID = new ObjectId(paramId);
          const record = await model.findOne({ _id: objID }).exec();
          if (!record) {
            return res.status(StatusCodes.NOT_FOUND).send(
              rtnMsg.invalidIdMessage(StatusCodes.NOT_FOUND, paramId)
            );
          }
        }
      }

      next();
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
}

module.exports = validateParamIDs;
