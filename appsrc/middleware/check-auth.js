const jwt = require('jsonwebtoken');

const HttpError = require('../modules/config/models/http-error');

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  try {
    const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'
    //console.log(`token: ${token}`);
    

    if (!token) {
      throw new Error('Authentication failed!');
    }
    //console.log(`process.env.JWT_SECRETKEY: ${process.env.JWT_SECRETKEY}`);
    const decodedToken = jwt.verify(token, process.env.JWT_SECRETKEY);
    //console.log(`decodedToken: ${ JSON.stringify(decodedToken)}`);
    /*
    const decodedToken = {
      userId: "63b889ff7d2bd88d8076262c",
      email: "naveed@terminustech.co.nz",
      userIP: "", 
      iat: 1676242110,
      exp: 1676245710
    }
    */
    const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
    decodedToken.userIP = clientIP;
    //console.log(`The client's IP Address is: ${clientIP}`);

    req.body.loginUser = decodedToken;
    next();
  } catch (err) {
    const error = new HttpError('Authentication failed!', 403);
    return next(error);
  }
};
