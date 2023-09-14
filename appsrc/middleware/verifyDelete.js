const jwt = require('jsonwebtoken');
const HttpError = require('../modules/config/models/http-error');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
let rtnMsg = require('../modules/config/static/static')
const { SecurityUser } = require('../modules/security/models');
const _ = require('lodash');

module.exports = (req, res, next) => {
  try {    
    if ("loginUser" in req.body && ("isArchived" in req.body && req.body.isArchived === true)){
      const loggedInUserID = req.body.loginUser.userId;
      SecurityUser.findById(loggedInUserID)
      .populate({ path: 'roles', select: '' })
      .exec(function (err, loggedInUser) {
        if (err) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
        }
        if (!loggedInUser) {
          return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.loggedInUserCustomMessageJSON(StatusCodes.BAD_REQUEST, 'Customer not found!', true));
        } else { 
          const isSuperAdmin = loggedInUser?.roles?.some(role => role.roleType === 'SuperAdmin');
          const disableDelete = loggedInUser?.roles?.some(role => role?.disableDelete === true);
          if(disableDelete){
            return res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordCustomMessageJSON(StatusCodes.FORBIDDEN, 'User is not authorized to delete!', true));
          }else{
            next();
          }
        }
      });
    }else{
      next();
      
      // return res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordCustomMessageJSON(StatusCodes.FORBIDDEN, 'User not found!', true));      
    }
  } catch (err) {
    console.log(err);
    const error = new HttpError('Verify Delete middleware failed!', 403);
    return next(error);
  }
};