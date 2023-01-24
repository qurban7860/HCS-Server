const models = require('../models');
const mongoose = require('mongoose');

let dbService = require('../../db/dbService')


class assetservice {
  constructor(model) {
    this.model = model;
    this.db = new dbService(models.Assets);
  }

  getObjectById(fields, id, populate, callback) {
    this.db.getObjectById(fields, id, populate, callbackFunc);
    function callbackFunc(error, response) {
      if (error) callback(error, {});
      else callback(null, response);
    }
  }


  getAssets(fields, query, orderBy, callback) {
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

  postAsset(assetSchema, callback) {
    this.db.postObject(assetSchema, callbackFunction);
    function callbackFunction(error, response) {
      if (error) callback(error, {});
      else callback(null, response);
    }
  }

  patchAsset(id, assetSchema, callback) {
    this.db.patchObject(id, assetSchema, callbackFunc);
    function callbackFunc(error, result) {
      if (error) callback(error, {});
      else callback(null, result);
    }
  };
}


module.exports = assetservice;