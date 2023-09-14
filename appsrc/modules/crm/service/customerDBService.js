const models = require('../models');
const mongoose = require('mongoose');
var async = require("async");

let dbService = require('../../db/dbService')


class CustomerService {
  constructor() {
    this.db = new dbService();
  }

  async getObject(model, query, populate, callback) {
    if(callback){
      this.db.getObject(model, query, populate, callbackFunc);
      function callbackFunc(error, response) {
        if (error) callback(error, {});
        else callback(null, response);
      }
    } else {
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
    } else {
      return await this.db.getObjectById(model, fields, id, populate); 
    }

  }

  async getObjectList(model, fields, query, orderBy, populate, callback) {
    if(callback){
      this.db.getObjectList(model, fields, query, orderBy, populate, callbackFunc);
      function callbackFunc(error, response) {
        if (error) callback(error, {});
        else callback(null, response);
      }
    } else {
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

  async postObject(newdocument, callback) {
    const db = this.db;
    async.waterfall([
      function (callback) {
        if (newdocument.mainSite != undefined && typeof newdocument.mainSite !== "string") {
          this.db.postObject(newdocument.mainSite, callbackFunction);
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



  async patchObject(model, id, newValues, callback) {
    if(callback){
      this.db.patchObject(model, id, newValues, callbackFunc);
      function callbackFunc(error, result) {
        if (error) callback(error, {});
        else callback(null, result);
      }  
    } else {
      return await this.db.patchObject(model, id, newValues);
    }
  };
}


module.exports = CustomerService;