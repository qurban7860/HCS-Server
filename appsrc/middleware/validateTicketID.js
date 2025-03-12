const { StatusCodes } = require('http-status-codes');
const { Types: { ObjectId } } = require('mongoose');
const rtnMsg = require('../modules/config/static/static');
const logger = require('../modules/config/logger');
const { Ticket } = require('../modules/tickets/models');
const ticketDBService = require('../modules/tickets/service/ticketDBService');
this.dbservice = new ticketDBService();
this.query = {};

const validateTicketID = (param) => {
  return async (req, res, next) => {
    try {
      let paramId = req.params[param];
      if (paramId && /^\d+$/.test(paramId) && paramId.length < 6) {
        paramId = paramId.padStart(5, '0');
        this.query.ticketNo = paramId;
        let result = await this.dbservice.getObject(Ticket, this.query);
        req.params[param] = result?._id;
      } else if (!paramId || !ObjectId.isValid(paramId)) {
        return res.status(StatusCodes.NOT_ACCEPTABLE).send(
          rtnMsg.recordMissingParamsMessage(StatusCodes.NOT_ACCEPTABLE, param)
        );
      }
      next();
    } catch (error) {
      console.log("error : ", error)
      logger.error(new Error(error));
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
    }
  };
}

module.exports = validateTicketID;
