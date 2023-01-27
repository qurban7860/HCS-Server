const models = require('../models');
const mongoose = require('mongoose');

let dbService = require('../../db/dbService')


class UserService {
  constructor(model) {
    this.model = model;
    this.db = new dbService(models.Users);
  }

  getObjectById(fields, id, populate, callback) {
    this.db.getObjectById(fields, id, populate, callbackFunc);
    function callbackFunc(error, response) {
      if (error) callback(error, {});
      else callback(null, response);
    }
  }


  getUsers(fields, query, orderBy, callback) {
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

  postUser(userSchema, callback) {
    this.db.postObject(userSchema, callbackFunction);
    function callbackFunction(error, response) {
      if (error) callback(error, {});
      else callback(null, response);
    }
  }

  patchUser(id, userSchema, callback) {
    this.db.patchObject(id, userSchema, callbackFunc);
    function callbackFunc(error, result) {
      if (error) callback(error, {});
      else callback(null, result);
    }
  };
}


module.exports = UserService;