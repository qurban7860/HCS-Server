const { format, isValid, getTime, parseISO, formatDistanceToNow, differenceInDays } = require('date-fns');

// ----------------------------------------------------------------------

function isValidDate(date) {
  if(isValid(new Date(date))){
    return true;
  }
    return false;
}

function fDate(date, newFormat) {

  const fm = newFormat || 'dd MMM yyyy';
  if(isValid(new Date(date))){
    return date ? format(new Date(date), fm) : '';
  }
    return date
}

function GetDifferenceInDays( definedDay ) {
  const today = new Date();
    
  const definedDate = parseISO(definedDay);
  
  const difference = differenceInDays(definedDate, today);
  
  return difference;
}

function fQuarterYearDate(startDate, newFormat) {

  if (startDate) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(start.getMonth() + 2); // Add 2 months to get the end of the quarter

    const formattedStartDate = format(start, 'MMM');
    const formattedEndDate = format(end, 'MMM yyyy')
    return `${formattedStartDate}-${formattedEndDate}`;
  }

  return '';
}

function fDateTime(date, newFormat) {
  const fm = newFormat || 'dd MMM yyyy p';
  if(isValid(new Date(date))){
    return date ? format(new Date(date), fm) : '';
  }
  return date
}

function fTimestamp(date) {
  if(isValid(date)){
    return date ? getTime(new Date(date)) : '';
  }
  return date
}

function fToNow(date) {
  return date
    ? formatDistanceToNow(new Date(date))
    : '';
}

function convertTimeToMilliseconds(timeString) {
  const timeComponents = timeString.split(' ');

  return timeComponents.reduce((totalMilliseconds, component) => {
    if (component.includes('h')) {
      const hours = parseInt(component, 10); // Specify radix 10
      return totalMilliseconds + hours * 60 * 60 * 1000;
    } if (component.includes('m')) {
      const minutes = parseInt(component, 10); // Specify radix 10
      return totalMilliseconds + minutes * 60 * 1000;
    } if (component.includes('s')) {
      const seconds = parseInt(component, 10); // Specify radix 10
      return totalMilliseconds + seconds * 1000;
    }
    return totalMilliseconds;
  }, 0);
}

module.exports = {
    isValidDate,
    fDate,
    GetDifferenceInDays,
    fQuarterYearDate,
    fDateTime,
    fTimestamp,
    fToNow,
    convertTimeToMilliseconds
};
