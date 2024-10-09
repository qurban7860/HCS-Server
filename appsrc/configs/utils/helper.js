
function flattenArray(list, key = 'children') {
  return list?.reduce((acc, item) => {
    acc.push(item);
    if (item[key]?.length) {
      acc.push(...flattenArray(item[key], key));
    }
    return acc;
  }, []);
}

// ----------------------------------------------------------------------

function flattenDeep(array) {
  const isArray = array && Array.isArray(array);
  if (isArray) {
    return array.flat(Infinity);
  }
  return [];
}

// ----------------------------------------------------------------------

function orderBy(array, properties, orders) {
  return array.slice().sort((a, b) => {
    for (let i = 0; i < properties.length; i += 1) {
      const property = properties[i];
      const order = orders && orders[i] === 'desc' ? -1 : 1;
      const aValue = a[property];
      const bValue = b[property];
      if (aValue < bValue) return -1 * order;
      if (aValue > bValue) return 1 * order;
    }
    return 0;
  });
}

// ----------------------------------------------------------------------

function keyBy(array, key) {
  return (array || []).reduce((result, item) => {
    const keyValue = key ? item[key] : item;
    return { ...result, [String(keyValue)]: item };
  }, {});
}

// ----------------------------------------------------------------------

function sumBy(array, iteratee) {
  return array.reduce((sum, item) => sum + iteratee(item), 0);
}

// ----------------------------------------------------------------------

function isEqual(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) {
    return a === b;
  }
  if (typeof a !== typeof b) {
    return false;
  }
  if (typeof a === 'string' || typeof a === 'number' || typeof a === 'boolean') {
    return a === b;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((item, index) => isEqual(item, b[index]));
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
      return false;
    }
    return keysA.every((key) => isEqual(a[key], b[key]));
  }
  return false;
}

// ----------------------------------------------------------------------

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// ----------------------------------------------------------------------

const merge = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();
  for (const key in source) {
    if (isObject(source[key])) {
      if (!target[key]) target[key] = {};
      merge(target[key], source[key]);
    } else if (Array.isArray(source[key])) {
      target[key] = [...(target[key] || []), ...source[key]];
    } else {
      target[key] = source[key];
    }
  }
  return merge(target, ...sources);
};

// ------------------------------------------------------------------------

function uniqueArray(array, key) {
  const seen = new Set();
  return array.filter((item) => {
    const value = key ? item[key] : item;
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

// -----------------------------------------------------------------------

function groupBy(array, key) {
  return array.reduce((result, item) => {
    const keyValue = key ? item[key] : item;
    if (!result[keyValue]) {
      result[keyValue] = [];
    }
    result[keyValue].push(item);
    return result;
  }, {});
}

// ------------------------------------------------------------------------

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

//  ------------------------------------------------------------------------

function throttle(fn, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// -------------------------------------------------------------------------

function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// -------------------------------------------------------------------------

function compact(array) {
  return array.filter(Boolean);
}

// -------------------------------------------------------------------------

function pick(object, keys) {
  return keys.reduce((result, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      result[key] = object[key];
    }
    return result;
  }, {});
}

// -------------------------------------------------------------------------

function omit(object, keys) {
  return Object.keys(object).reduce((result, key) => {
    if (!keys.includes(key)) {
      result[key] = object[key];
    }
    return result;
  }, {});
}

// -------------------------------------------------------------------------

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// -------------------------------------------------------------------------

function range(start, end) {
  return Array.from({ length: end - start }, (_, i) => i + start);
}

// -------------------------------------------------------------------------

export function cloneDeep(value) {
  if (Array.isArray(value)) {
    return value.map(cloneDeep);
  } else if (typeof value === 'object' && value !== null) {
    return Object.keys(value).reduce((result, key) => {
      result[key] = cloneDeep(value[key]);
      return result;
    }, {});
  } else {
    return value;
  }
}

// -------------------------------------------------------------------------

function intersection(...arrays) {
  if (!arrays.length) return [];
  return arrays.reduce((acc, arr) => acc.filter((item) => arr.includes(item)));
}

// -------------------------------------------------------------------------

function difference(array, ...values) {
  const valueSet = new Set(values.flat());
  return array.filter((item) => !valueSet.has(item));
}

// ------------------------------------------------------------------------

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ------------------------------------------------------------------------

function isObjectEmpty(obj) {
  return Object.keys(obj).length === 0;
}

// ------------------------------------------------------------------------

function isArrayEmpty(arr) {
  return !arr || arr.length === 0;
}

// ------------------------------------------------------------------------

function isFunction(value) {
  return typeof value === 'function';
}

// -------------------------------------------------------------------------

function isValidURL(url) {
  const re = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  return re.test(url);
}

// -------------------------------------------------------------------------

function isPhoneNumberValid(phone) {
  const re = /^\+?[1-9]\d{1,14}$/;
  return re.test(phone);
}

// -------------------------------------------------------------------------

module.exports = {
  flattenArray,
  flattenDeep,
  orderBy,
  keyBy,
  sumBy,
  isEqual,
  isObject,
  merge,
  uniqueArray,
  groupBy,
  debounce,
  throttle,
  chunk,
  compact,
  pick,
  omit,
  random,
  range,
  cloneDeep,
  intersection,
  difference,
  sleep,
  isObjectEmpty,
  isArrayEmpty,
  isFunction,
  isValidURL,
  isPhoneNumberValid
}