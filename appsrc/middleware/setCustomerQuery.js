const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
let rtnMsg = require('../modules/config/static/static')
const { SecurityUser } = require('../modules/security/models');
const _ = require('lodash');
const logger = require('../modules/config/logger');

module.exports = async (req, res, next) => {
  try {
    const token = req && req.headers && req.headers.authorization ? req.headers.authorization.split(' ')[1] : ''; // Authorization: 'Bearer TOKEN'
    if (!token || token.length == 0) {
      return res.status(403).send("Authentication failed!");
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRETKEY);
    const { userId } = decodedToken;
    const userData = await SecurityUser.findById(userId).populate({ path: 'customer', select: 'name type isActive isArchived' })

    if (!userData?._id) {
      return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Customer not found!', true));
    }

    if (_.isEmpty(userData.customer) || userData.customer.isActive == false || userData.customer.isArchived == true) {
      return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Customer verifcation failed!', true));
    }

    if (userData?.customer?.type?.toLowerCase() !== "sp") {
      req.query.customer = userData?.customer?._id;
    }

    next()

  } catch (error) {
    logger.error(new Error(error));
    return next(error);
  }
};