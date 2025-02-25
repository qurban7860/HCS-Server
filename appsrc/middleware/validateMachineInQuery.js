const { StatusCodes } = require('http-status-codes');
let rtnMsg = require('../modules/config/static/static')
const { Types: { ObjectId } } = require('mongoose');
const logger = require('../modules/config/logger');
const { Product } = require('../modules/products/models');
const { SecurityUser } = require('../modules/security/models');

const _ = require('lodash');

module.exports = async (req, res, next) => {
  try {

    if (req?.query?.machine && ObjectId.isValid(req.query.machine)) {

      const userId = req.body.loginUser?.userId
      const userRecord = await SecurityUser.findById(userId).populate({ path: 'customer', select: 'name type isActive isArchived' })

      if (!userRecord?.customer?._id)
        return res.status(StatusCodes.UNAUTHORIZED).send("Not Authorized!");

      const record = await Product.findById(req?.query?.machine).populate({ path: 'customer', select: 'name type isActive isArchived' })

      if (!record?._id)
        return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Machine not found!', true));

      if (!Array.isArray(record.customer) && record.customer?._id?.toString() !== userRecord?.customer?._id?.toString())
        return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Invalid Machine!', true));


      if (_.isEmpty(record.customer) || record.customer.isActive == false || record.customer.isArchived == true)
        return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Machine verifcation failed!', true));

      next();
    } else {
      return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Machine not found!', true));
    }

  } catch (error) {
    logger.error(new Error(error));
    return next(error);
  }
};