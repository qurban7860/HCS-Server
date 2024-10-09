const jwt = require('jsonwebtoken');

async function getToken(req) {
    try {
        const token = req && req.headers && req.headers.authorization ? req.headers.authorization.split(' ')[1] : '';
        const decodedToken = await jwt.verify(token, process.env.JWT_SECRETKEY);
        const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
        decodedToken.userIP = clientIP;
        return decodedToken;
    } catch (error) {
        throw new Error('Token verification failed');
    }
}

module.exports = {
    getToken
}