const models = require('../models');
const mongoose = require('mongoose');

let dbService = require('../../db/dbService')


class MachineService {
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

  getObjectList(model, fields, query, orderBy, populate, callback) {
    this.db.getObjectList(model, fields, query, orderBy, populate, callbackFunc);
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
    //console.log("Object To Post :", document);
    this.db.postObject(document, callbackFunction);
    function callbackFunction(error, response) {
      if (error) callback(error, {});
      else callback(null, response);
    }
  }

  patchObject(model, id, document, callback) {
    //console.log("Document To Patch :", document);
    this.db.patchObject(model, id, document, callbackFunc);
    function callbackFunc(error, result) {
      if (error) callback(error, {});
      else callback(null, result);
    }
  };
}


module.exports = MachineService;