const models = require('../assets/models');
const mongoose = require('mongoose');

class dbService {
  constructor(model) {
    this.model = model;
  }

  getObjectById(fields, id, populate, callback) {    
    this.model.findById(id, fields).populate(populate).exec((err, documents) => {
      if (err) {
        callback(err, {});
      } else {
        callback(null, documents != null ? documents : {});
      }
    });
  }

  getObjectList(fields, query, orderBy, callback) {
    this.model.find(query, fields).sort(orderBy).exec((err, documents) => {
      if (err) {
        callback(err, []);
      } else {
        callback(null, documents != null ? documents : []);
      }
    });
  }

  deleteObject(id, callback) {
    this.model.deleteOne({ _id: id }).then(function (result) {
      callback(null, result);
    }).catch(function (err) {
      callback(err);
    });
  }

  postObject(Object, callback) {
    Object.save((error, data) => {
      if (error) {
        console.error(error);
        callback(error);
      } else {
        callback(null, data);
      }
    });
  }

  patchObject(id, scheme, callback) {
    this.model.updateOne({ _id: id}, scheme).then(function (doc) {
      callback(null, doc);
    }).catch(function (err) {
      callback(err);
    });
  }
}


module.exports = dbService;