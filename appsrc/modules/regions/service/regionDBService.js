const models = require('../models');
const mongoose = require('mongoose');
var async = require("async");

let dbService = require('../../db/dbService');
const { response } = require('express');


class RegionService {
  constructor() {
    this.db = new dbService();
  }

  // getObject(model, query, populate, callback) {
  //   this.db.getObject(model, query, populate, callbackFunc);
  //   function callbackFunc(error, response) {
  //     if (error) callback(error, {});
  //     else callback(null, response);
  //   }
  // }{}
  
  async getObject(model, query, populate) {
    try {
      const response = await this.db.getObject(model, query, populate);
      return response;
    } catch (error) {
      return error;
    }
  }

  async getObjectById(model, fields, id, populate) {
    try {
      const response = await this.db.getObjectById(model, fields, id, populate);
      return response;
    } catch (error) {
      return error;
    }
  }

  async getObjectList(model, fields, query, orderBy, populate) {
    try {
      const response = await this.db.getObjectList(model, fields, query, orderBy, populate);
      return response;
    } catch (error) {
      return error;
    }
  }

  async deleteObject(model, id, res, callback){
    try{
      if(callback){
        this.db.deleteObject(model, id, res, callbackFunc);
        function callbackFunc(error, response) {
          if (error) callback(error, {});
          else callback(null, response);
        }
      }else{
        return await this.db.deleteObject(model, id, res);
      }
    } catch(error) {
      return error;
    }
  }

  async postObject(document){
    try{
      const response = await this.db.postObject(document);
      return response;
    }
    catch(error){
      return error;
    }
  }
  
  async patchObject(model, id, document){
    try{
      const response = await this.db.patchObject(model, id, document);
      return response;
    }
    catch(error){
      return error;
    }
  }
}


module.exports = RegionService;