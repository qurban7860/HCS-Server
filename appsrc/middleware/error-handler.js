const HttpError = require('../modules/config/models/http-error');
const logger = require('../modules/config/logger');

module.exports = (error, req, res, next) => {
    if (req.file) {
      fs.unlink(req.file.path, err => {
        logger.error(new Error(err));
      });
    }
    if (res.headerSent) {
      return next(error);
    }
    res.status(error.code || 500);
    res.json({ message: error.message || 'An unknown error occurred!' });
};
