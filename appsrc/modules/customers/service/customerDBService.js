const models = require('../models');
const mongoose = require('mongoose');
var async = require("async");

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

  postObject(newdocument, callback) {
    const db = this.db;
    async.waterfall([
      function (callback) {
        if (newdocument.site != undefined && typeof newdocument.site !== "string") {
          this.db.postObject(newdocument.site, callbackFunction);
          function callbackFunction(error, response) {
            console.log(error);
            if (error) callback(error, {});
            else {
              newdocument.sites.push(response._id);
              newdocument.mainSite = response._id;
              callback(null, newdocument);
            }
          }
        } else {
          callback(null, newdocument);
        }
      }.bind(this),
      function (data, callback) {
        if (newdocument.billingContact != undefined && typeof newdocument.billingContact !== "string") {
          this.db.postObject(newdocument.billingContact, callbackFunction);
          function callbackFunction(error, response) {
            console.log(error);
            if (error) callback(error, {});
            else {
              newdocument.contacts.push(response._id);
              newdocument.primaryBillingContact = response._id;
              callback(null, newdocument);
            }
          }
        } else {
          callback(null, newdocument);
        }
      }.bind(this),
      function (data, callback) {
        if (newdocument.technicalContact != undefined && typeof newdocument.technicalContact !== "string") {
          this.db.postObject(newdocument.technicalContact, callbackFunction);
          function callbackFunction(error, response) {
            console.log(error);
            if (error) callback(error, {});
            else {
              newdocument.contacts.push(response._id);
              newdocument.primaryTechnicalContact = response._id;
              callback(null, newdocument);
            }
          }
        } else {
          callback(null, newdocument);
        }
      }.bind(this),
    ], function (err, result) {
      if (err) return callback(err);
      db.postObject(newdocument, callbackFunction);
      function callbackFunction(error, response) {
        if (error) callback(error, {});
        else callback(null, response);
      }
    }.bind(this));
  }



  patchObject(model, id, newValues, callback) {
    this.db.patchObject(model, id, newValues, callbackFunc);
    function callbackFunc(error, result) {
      if (error) callback(error, {});
      else callback(null, result);
    }
  };
}


module.exports = MachineService;