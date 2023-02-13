const jwt = require('jsonwebtoken');

const HttpError = require('../modules/config/models/http-error');

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  try {
    const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'
    if (!token) {
      //throw new Error('Authentication failed!');
    }
    //const decodedToken = jwt.verify(token, process.env.JWT_SECRETKEY);
    const decodedToken = {
      userId: "639b0dcde7a66c6d1ae4b43f", 
      email: "harisahmaad@gmail.com",
      iat: 2976242110,
      exp: 3676245710
    }
    req.body.loginUser = decodedToken;
    //req.loginUser = { userId:'639b0dcde7a66c6d1ae4b43f' };

    //req.loginUser = { userId: decodedToken.userId };
    next();
  } catch (err) {
    const error = new HttpError('Authentication failed!', 403);
    return next(error);
  }
};
