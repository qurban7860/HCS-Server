const models = require('../models');
const mongoose = require('mongoose');

let dbService = require('../../db/dbService')


class customerservice {
  constructor(model) {
    this.model = model;
    this.db = new dbService(models.Customers);
  }

  getObjectById(fields, id, populate, callback) {
    this.db.getObjectById(fields, id, populate, callbackFunc);
    function callbackFunc(error, response) {
      if (error) callback(error, {});
      else callback(null, response);
    }
  }


  getCustomers(fields, query, orderBy, callback) {
    this.db.getObjectList(fields, query, orderBy, callbackFunc);
    function callbackFunc(error, response) {
      if (error) callback(error, {});
      else callback(null, response);
    }
  };


  deleteObject(id, callback) {
    this.db.deleteObject(id, callbackFunc);
    function callbackFunc(error, response) {
      if (error) callback(error, {});
      else callback(null, response);
    }
  };

  postCustomer(customerSchema, callback) {
    this.db.postObject(customerSchema, callbackFunction);
    function callbackFunction(error, response) {
      if (error) callback(error, {});
      else callback(null, response);
    }
  }

  patchCustomer(id, customerSchema, callback) {
    this.db.patchObject(id, customerSchema, callbackFunc);
    function callbackFunc(error, result) {
      if (error) callback(error, {});
      else callback(null, result);
    }
  };
}


module.exports = customerservice;