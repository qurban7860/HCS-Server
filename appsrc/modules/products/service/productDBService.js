const models = require('../models');
const mongoose = require('mongoose');

let dbService = require('../../db/dbService')


class ProductService {
  constructor() {
    this.db = new dbService();
  }

  async getObject(model, query, populate, callback) {
    if(callback) {
      this.db.getObject(model, query, populate, callbackFunc);
      function callbackFunc(error, response) {
        if (error) callback(error, {});
        else callback(null, response);
      }
    }
    else {
      return await this.db.getObject(model, query, populate);
    }
  }

  async getObjectById(model, fields, id, populate, callback) {
    if(callback) {
      this.db.getObjectById(model, fields, id, populate, callbackFunc);
      function callbackFunc(error, response) {
        if (error) callback(error, {});
        else callback(null, response);
      }
    }
    else {
      return await this.db.getObjectById(model, fields, id, populate);
    }
  }

  async getObjectList(model, fields, query, orderBy, populate, callback) {
    if(callback) {
      this.db.getObjectList(model, fields, query, orderBy, populate, callbackFunc);
      function callbackFunc(error, response) {
        if (error) callback(error, {});
        else callback(null, response);
      }
    }
    else {
      return await this.db.getObjectList(model, fields, query, orderBy, populate);
    }
  };

  async getObjectListWithAggregate(model, aggregate, params, callback) {
    if(callback) {
      this.db.getObjectListWithAggregate(model, aggregate, params, callbackFunc);
      function callbackFunc(error, response) {
        if (error) callback(error, {});
        else callback(null, response);
      }
    } else {
      return await this.db.getObjectListWithAggregate(model, aggregate, params);
    }

  };

  async deleteObject(model, id, res, callback) {
    if(callback) {
      this.db.deleteObject(model, id, res, callbackFunc);
      function callbackFunc(error, response) {
        if (error) callback(error, {});
        else callback(null, response);
      }
    }
    else {
      return await this.db.deleteObject(model, id, res);
    }
  };

  async postObject(document, callback) {
    if(callback) {
      this.db.postObject(document, callbackFunction);
      function callbackFunction(error, response) {
        if (error) callback(error, {});
        else callback(null, response);
      }
    }
    else {
      return await this.db.postObject(document);
    }
  }

  async patchObject(model, id, document, callback) {
    if(callback) {
      this.db.patchObject(model, id, document, callbackFunc);
      function callbackFunc(error, result) {
        if (error) callback(error, {});
        else callback(null, result);
      }
    }
    else {
      return await this.db.patchObject(model, id, document);
    }
  };
}


module.exports = ProductService;