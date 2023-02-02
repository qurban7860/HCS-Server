const models = require('../models');
const mongoose = require('mongoose');

let dbService = require('../../../db/dbService')


class SiteService {
  constructor() {
    this.db = new dbService();
  }

  getObjectById(model, fields, id, populate, callback) {
    this.db.getObjectById(model, fields, id, populate, callbackFunc);
    function callbackFunc(error, response) {
      if (error) callback(error, {});
      else callback(null, response);
    }
  }


  getSites(model, fields, query, orderBy, callback) {
    this.db.getObjectList(model, fields, query, orderBy, callbackFunc);
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

  postSite(siteSchema, callback) {
    this.db.postObject(siteSchema, callbackFunction);
    function callbackFunction(error, response) {
      if (error) callback(error, {});
      else callback(null, response);
    }
  }

  patchSite(model, id, siteSchema, callback) {
    this.db.patchObject(model, id, siteSchema, callbackFunc);
    function callbackFunc(error, result) {
      if (error) callback(error, {});
      else callback(null, result);
    }
  };
}


module.exports = SiteService;