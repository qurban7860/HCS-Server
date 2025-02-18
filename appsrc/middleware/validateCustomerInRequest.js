
const { StatusCodes } = require('http-status-codes');
let rtnMsg = require('../modules/config/static/static')
const logger = require('../modules/config/logger');
const { SecurityUser } = require('../modules/security/models');
const { Types: { ObjectId } } = require('mongoose');
const _ = require('lodash');

module.exports = async (req, res, next) => {
  try {

    if (req?.body?.customer && ObjectId.isValid(req.body.customer)) {
      const userId = req.body.loginUser?.userId
      if (!userId)
        return res.status(StatusCodes.UNAUTHORIZED).send("Not Authorized!");

      const record = await SecurityUser.findById(userId).populate({ path: 'customer', select: 'name type isActive isArchived' })

      if (!record)
        return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Customer not found!', true));

      if (!Array.isArray(record.customer) && record.customer?._id?.toString() !== req?.body?.customer?.toString())
        return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Invalid Customer!', true));

      if (Array.isArray(record.customer) && record.customer?.every(CID => CID?._id?.toString() != req?.body?.customer?.toString()))
        return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Invalid Customer!', true));

      if (_.isEmpty(record.customer) || record.customer.isActive == false || record.customer.isArchived == true)
        return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Customer verifcation failed!', true));

      next();
    } else {
      return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Customer not found!', true));
    }
  } catch (error) {
    logger.error(new Error(error));
    return next(error);
  }
};