const jwt = require('jsonwebtoken');

const HttpError = require('../modules/config/models/http-error');

module.exports = (req, res, next) => {

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
    //console.log(`token: ${token}`);
    

    if (!token || token.length == 0) {
      throw new Error('Authentication failed!');
    }
    //console.log(`process.env.JWT_SECRETKEY: ${process.env.JWT_SECRETKEY}`);
    const decodedToken = jwt.verify(token, process.env.JWT_SECRETKEY);
    //console.log(`decodedToken: ${ JSON.stringify(decodedToken)}`);
    
    const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
    decodedToken.userIP = clientIP;
    //console.log(`The client's IP Address is: ${clientIP}`);
    // console.log('decoded token ---------->', decodedToken);
    req.body.loginUser = decodedToken;
    next();
  } catch (err) {
    console.log('middleware------------------------');
    //console.log(err);
    const error = new HttpError('Authentication failed!', 403);
    return next(error);
  }
};
