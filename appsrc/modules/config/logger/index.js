const buildDevLogger = require('./dev-Logger');
const buildProLogger = require('./pro-Logger');




let logger = null;

if(process.env.ENV != null && process.env.ENV != undefined && process.env.ENV == 'dev') {
    logger = buildDevLogger();
  } else {
    logger = buildProLogger();
  }


module.exports = logger;