const { StatusCodes } = require('http-status-codes');
let rtnMsg = require('../modules/config/static/static')
const logger = require('../modules/config/logger');

module.exports = async (req, res, next) => {
  try {

    if (!req.query.customer) {
      return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Customer not found!', true));
    }
    next();

  } catch (error) {
    logger.error(new Error(error));
    return next(error);
  }
};