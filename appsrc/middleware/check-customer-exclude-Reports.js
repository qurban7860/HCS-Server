const jwt = require('jsonwebtoken');
const HttpError = require('../modules/config/models/http-error');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
let rtnMsg = require('../modules/config/static/static')
const _ = require('lodash');

module.exports = (req, res, next) => {
  // if (req.method === 'OPTIONS' || 
  // req.url.toLowerCase() === '/gettoken' || 
  // req.url.toLowerCase() === '/forgetpassword' || 
  // req.url.toLowerCase() === '/forgetpassword/verifytoken') {
  //   return next();
  // }
  try {    
    const token = req && req.headers && req.headers.authorization ? req.headers.authorization.split(' ')[1]:''; // Authorization: 'Bearer TOKEN'
    if (!token || token.length == 0) {
      next();
    }
    else{
      let excludeReports = req.body.loginUser?.excludeReports == 'true' || req.body.loginUser?.excludeReports == true ? true : false;
      excludeReports = false;
      if(excludeReports) {
        return res.status(StatusCodes.BAD_REQUEST).send({message: 'Customer not allowed to access information!'});
      }
      next();
    }    
  } catch (err) {
    console.log(err);
    console.log('middleware 21---------------------------');
    const error = new HttpError('Authentication failed!', 403);
    return next(error);
  }
};