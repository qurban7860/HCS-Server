const { machineLogTypeFormats } = require('./logTypeFormatConstants');

const convertAllInchesBitsToMM = (logs, type) => {
  let inchesError = false;
  let invalidUnitError = false;
  
  const logTypeFormat = machineLogTypeFormats.find(format => format.type === type);
  if (!logTypeFormat?.numericalLengthValues) {
    return logs;
  }
  
  const convertedLogs = logs.map((log) => {
    const dataInInches = {};
    
    // Check for invalid measurement units
    if (log?.measurementUnit && !['in', 'mm'].includes(log.measurementUnit)) {
      invalidUnitError = true;
      return log;
    }
    
    if (log?.measurementUnit === 'in') {
      logTypeFormat.numericalLengthValues.forEach((key) => {
        if (log[key] !== undefined && log[key] !== null) {
          const numValue = Number(log[key]);
          if (Number.isNaN(numValue)) {
            inchesError = true;
          }
          dataInInches[key] = numValue;
          const mmValue = (numValue * 25.4).toFixed(2);
          log[key] = Number(mmValue);
        }
      });
      
      if (Object.keys(dataInInches).length > 0) {
        log.srcInfo = { measurementUnit: 'in', ...dataInInches };
        log.measurementUnit = 'mm';
      }
    }
    return log;
  });
  
  if (inchesError) return null;
  if (invalidUnitError) return { error: 'Invalid measurement unit. Only "in" and "mm" are allowed.' };
  return convertedLogs;
};

const convertTimestampToDate = (logObj) => {
  if (logObj.timestamp && !logObj.date) {
    logObj.srcInfo = logObj.srcInfo || {};
    logObj.srcInfo.timestamp = logObj.timestamp;
    logObj.date = logObj.timestamp;
    delete logObj.timestamp;
  }
  return logObj;
}

module.exports = {
  convertAllInchesBitsToMM,
  convertTimestampToDate,
};