const { StatusCodes } = require('http-status-codes');

const ObjectId = require('mongoose').Types.ObjectId;
const rtnMsg = require('../modules/config/static/static')
const ipRangeCheck = require("ip-range-check");
const configs = require('../modules/config/models/config');

module.exports = async (req, res, next) => {

  const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
  let blackIpFlag = true;
  let whiteIpFlag = true;

  const IPs = await configs.find({name:{$in:["blackListIps","whiteListIps"]}});
  const blackListIps = IPs.find((ip)=>ip.name=='blackListIps');
  let blackListIpArr = [];
  if(blackListIps && blackListIps.value) {
    if(blackListIps.value.indexOf(',')>-1) {
      blackListIpArr = blackListIps.value.split(',');
    }
    else {
      blackListIpArr = [blackListIps.value];
    }
    for(let blackListIp of blackListIpArr) {
      let ipCheck = ipRangeCheck(clientIP, blackListIp);
      if(ipCheck) {
        blackIpFlag = false;
        return res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordInvalidCredenitalsMessage(StatusCodes.FORBIDDEN));
      }
      
    }
  }
  const whiteListIps = IPs.find((ip)=>ip.name=='whiteListIps');

  let whiteListIpArr = [];
  if(whiteListIps && whiteListIps.value) {
    if(whiteListIps.value.indexOf(',')>-1) {
      whiteListIpArr = whiteListIps.value.split(',');
    }
    else {
      whiteListIpArr = [whiteListIps.value];
    }
    whiteIpFlag = false;
    for(let whiteListIp of whiteListIpArr) {
      let ipCheck = ipRangeCheck(clientIP, whiteListIp);
      if(ipCheck) {
        whiteIpFlag = true;
      }
    }
    
    if(!whiteIpFlag)
      return res.status(StatusCodes.FORBIDDEN).send(rtnMsg.recordInvalidCredenitalsMessage(StatusCodes.FORBIDDEN));

  }

  if(blackIpFlag && whiteIpFlag)
    next();
  else 
    return res.status(StatusCodes.BAD_REQUEST).send(rtnMsg.recordCustomMessage(StatusCodes.BAD_REQUEST, 'ipvalidation failed!'));

};