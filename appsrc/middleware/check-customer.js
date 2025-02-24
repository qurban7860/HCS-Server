const jwt = require('jsonwebtoken');
const HttpError = require('../modules/config/models/http-error');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
let rtnMsg = require('../modules/config/static/static')
const { SecurityUser } = require('../modules/security/models');
const _ = require('lodash');
const logger = require('../modules/config/logger');


module.exports = (req, res, next) => {
  if (req.headers["howickportalkey"] && req.headers["machineserialno"] && req.headers["ipcserialno"] && req.headers["computerguid"]) {
    return next();
  }
  if (req.method === 'OPTIONS' || 
  req.url.toLowerCase() === '/gettoken' || 
  req.url.toLowerCase() === '/forgetpassword' || 
  req.url.toLowerCase() === '/forgetpassword/verifytoken') {
    return next();
  }
  try {    
    const token = req && req.headers && req.headers.authorization ? req.headers.authorization.split(' ')[1]:''; // Authorization: 'Bearer TOKEN'
    if (!token || token.length == 0) {
      next();
    }
    else{
      const decodedToken = jwt.verify(token, process.env.JWT_SECRETKEY);
      const { userId } = decodedToken;
      
      SecurityUser.findById(userId)
      .populate({ path: 'customer', select: 'name type isActive isArchived' })
      .exec(function (err, record) {
        if (err) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
        }
        if (!record) {
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Customer not found!', true));
        } else {
            if (_.isEmpty(record.customer) || record.customer.isActive == false || record.customer.isArchived == true) {
              res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Customer verifcation failed!', true));
            }else{
              next();
            }        
        }
      });
    }    
  } catch (err) {
    logger.error(new Error(err));
    const error = new HttpError('Authentication failed!', 403);
    return next(error);
  }
};