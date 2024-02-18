const jwt = require('jsonwebtoken');

const HttpError = require('../modules/config/models/http-error');
const { SecuritySession } = require('../modules/security/models');

module.exports = async (req, res, next) => {
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
    // console.log(`token: ${token}`);
        

    if (!token || token.length == 0) {
      throw new Error('AuthError');
      return next();

    } 
    
    // console.log(`process.env.JWT_SECRETKEY: ${process.env.JWT_SECRETKEY}`);
    const decodedToken = jwt.verify(token, process.env.JWT_SECRETKEY);
    // console.log(`decodedToken: ${ JSON.stringify(decodedToken)}`);
    
    if(decodedToken && decodedToken.userId) {

      let session = await SecuritySession.findOne({"session.user":decodedToken.userId});

      if(decodedToken.sessionId && session.session.sessionId!=decodedToken.sessionId) {
        // console.log(decodedToken.sessionId,session.session.sessionId,'here1');
        throw new Error('AuthError');
        return next();
      }

      if(session) {
        let expireAt = new Date(session.expires);
        let timeDifference = Math.ceil(expireAt.getTime() - new Date().getTime());
        // console.log(timeDifference,'here2',session.expires,expireAt.getTime(),new Date().getTime());

        if(timeDifference<1) {
          await SecuritySession.deleteMany({"session.user":decodedToken.userId});
          await SecuritySession.deleteMany({"session.user":{$exists:false}});
          // console.log('here3');

          throw new Error('AuthError');
          return next()
        }
      }
      else {
        // console.log('here4');

        throw new Error('AuthError');
        return next()
      }
     
    }

    const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
    decodedToken.userIP = clientIP;
    //console.log(`The client's IP Address is: ${clientIP}`);
    // console.log('decoded token ---------->', decodedToken);
    req.body.loginUser = decodedToken;

    if(req.query?.pagination?.page) {
      req.body.page = req.query?.pagination?.page;
      req.body.pageSize = req.query?.pagination?.pageSize;
      delete req.query?.pagination;
    }
    next();
  } catch (err) {
    console.log('middleware------------------------111');
    // console.log(err);
    const error = new HttpError('Authentication failed!', 403);
    return next(error);
  }
};
