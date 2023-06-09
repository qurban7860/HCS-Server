const models = require('../models');
const mongoose = require('mongoose');
var async = require("async");

let dbService = require('../../db/dbService');
const { response } = require('express');


class DocumentService {
  constructor() {
    this.db = new dbService();
  }

  async getObject(model, query, populate, callback) {
    try {
      if(callback) {
        return this.db.getObject(model, query, populate, callback)
      }
      else {
        return await this.db.getObject(model, query, populate);
      }
    } catch (error) {
      return error;
    }
  }

  async getObjectById(model, fields, id, populate, callback) {
    try {
      if(callback) {
        return this.db.getObjectById(model, fields, id, populate, callback)
      }
      else {
        return await this.db.getObjectById(model, fields, id, populate);

      }
    } catch (error) {
      return error;
    }
  }

  async getObjectList(model, fields, query, orderBy, populate, callback) {
    try {
      if(callback) {
        return this.db.getObjectList(model, fields, query, orderBy, populate, callback);
      }
      else {
        return await this.db.getObjectList(model, fields, query, orderBy, populate);
      }
    } catch (error) {
      return error;
    }
  }

  async deleteObject(model, id, callback){
    try{
      if(callback) {
        return this.db.deleteObject(model, id, callback);
      }
      else {
        return await this.db.deleteObject(model, id);
      }
    }
    catch(error){
      return error;
    }
  }

  async postObject(document, callback){
    try{
      if(callback) {
        return this.db.postObject(document, callback);
      }
      else {
        return await this.db.postObject(document);
      }
    }
    catch(error){
      return error;
    }
  }
  
  async patchObject(model, id, document, callback){
    try{
      if(callback) {
        return this.db.patchObject(model, id, document, callback);
      }
      else {
        return await this.db.patchObject(model, id, document);
      }
    }
    catch(error){
      return error;
    }
  }
}


module.exports = DocumentService;