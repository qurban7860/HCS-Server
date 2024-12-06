const jwt = require('jsonwebtoken');

const HttpError = require('../modules/config/models/http-error');
const { SecuritySession } = require('../modules/security/models');
const logger = require('../modules/config/logger');

module.exports = async (req, res, next) => {
  if (req.headers["x-portal-key"] && req.headers["x-machine-serial-no"] && req.headers["x-ipc-serial-no"] && req.headers["x-computer-guid"]) {
    return next();
  }
  if (req.method === 'OPTIONS' || 
  req.url.toLowerCase() === '/gettoken' || 
  req.url.toLowerCase() === '/forgetpassword' || 
  req.url.includes("verifyInviteCode")  || 
  req.url.includes("updatePasswordUserInvite")  || 
  req.url.toLowerCase() === '/forgetpassword/verifytoken') {
    return next();
  }
  try {
    
    const token = req && req.headers && req.headers.authorization ? req.headers.authorization.split(' ')[1]:''; // Authorization: 'Bearer TOKEN'
        

    if (!token || token.length == 0) {
      throw new Error('AuthError');
      return next();

    } 
    
    const decodedToken = jwt.verify(token, process.env.JWT_SECRETKEY);
    
    if(decodedToken && decodedToken.userId) {

      let session = await SecuritySession.findOne({"session.user":decodedToken.userId});

      if(decodedToken.sessionId && session.session.sessionId!=decodedToken.sessionId) {
        throw new Error('AuthError');
        return next();
      }

      if(session) {
        let expireAt = new Date(session.expires);
        let timeDifference = Math.ceil(expireAt.getTime() - new Date().getTime());

        if(timeDifference<1) {
          await SecuritySession.deleteMany({"session.user":decodedToken.userId});
          await SecuritySession.deleteMany({"session.user":{$exists:false}});

          throw new Error('AuthError');
          return next()
        }
      }
      else {
        throw new Error('AuthError');
        return next()
      }
     
    }

    const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
    decodedToken.userIP = clientIP;
    req.body.loginUser = decodedToken;

    if(req.query?.pagination?.page) {
      req.body.page = req.query?.pagination?.page;
      req.body.pageSize = req.query?.pagination?.pageSize;
      delete req.query?.pagination;
    }
    next();
  } catch (err) {
    logger.error(new Error(err));
    const error = new HttpError('Authentication failed!', 403);
    return next(error);
  }
};
