const models = require('../models');
const mongoose = require('mongoose');
var async = require("async");

let dbService = require('../../db/dbService')


class SecurityService {
  constructor() {
    this.db = new dbService();
  }

  getObject(model, query, populate, callback) {
    this.db.getObject(model, query, populate, callbackFunc);
    function callbackFunc(error, response) {
      if (error) callback(error, {});
      else callback(null, response);
    }
  }

  getObjectById(model, fields, id, populate, callback) {
    this.db.getObjectById(model, fields, id, populate, callbackFunc);
    function callbackFunc(error, response) {
      if (error) callback(error, {});
      else callback(null, response);
    }
  }

  getObjectList(model, fields, query, orderBy, populate, callback) {
    this.db.getObjectList(model, fields, query, orderBy, populate, callbackFunc);
    function callbackFunc(error, response) {
      if (error) callback(error, {});
      else callback(null, response);
    }
  };

  getObjectListWithAggregate(model, aggregate, params, callback) {
    this.db.getObjectListWithAggregate(model, aggregate, params, callbackFunc);
    function callbackFunc(error, response) {
      if (error) callback(error, {});
      else callback(null, response);
    }
  };

  deleteObject(model, id, callback) {
    this.db.deleteObject(model, id, callbackFunc);
    function callbackFunc(error, response) {
      if (error) callback(error, {});
      else callback(null, response);
    }
  };

  postObject(document, callback) {
    this.db.postObject(document, callbackFunction);
    function callbackFunction(error, response) {
      if (error) callback(error, {});
      else callback(null, response);
    }
  }

  patchObject(model, id, newValues, callback) {
    this.db.patchObject(model, id, newValues, callbackFunc);
    function callbackFunc(error, result) {
      if (error) callback(error, {});
      else callback(null, result);
    }
  };
}


module.exports = SecurityService;