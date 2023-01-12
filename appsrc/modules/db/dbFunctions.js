const models = require('../asset/models');
const mongoose = require('mongoose');

class dbFunctions {
  constructor(model) {
    this.model = model;
  }

  getObjectById(fields, query, orderBy, callback) {
    this.model.find(query, fields).sort(orderBy).exec((err, documents) => {
      if (err) {
        callback(err);
      } else {
        callback(null, documents);
      }
    });
  }

  getObject(fields, query, orderBy, callback) {
    this.model.find(query, fields).sort(orderBy).exec((err, documents) => {
      if (err) {
        callback(err);
      } else {
        callback(null, documents);
      }
    });
  }


  getList(fields, query, orderBy, callback) {
    this.model.find(query, fields).sort(orderBy).exec((err, documents) => {
      if (err) {
        callback(err);
      } else {
        callback(null, documents);
      }
    });
  }


  postObject(Object, callback) {
    Object.save((error, data) => {
      if (error) {
        console.error(error);
        callback(err);
      } else {
        callback(null, data);
      }
    });
  }

  deleteObject(id, callback) {
    models.Assets.deleteOne({ _id: id }).then(function (result) {
      callback(null, result);
    }).catch(function (err) {
      callback(err);
    });
  }


  putObject(id, assetSchema, callback) {
    models.Assets.updateOne({ _id: id, assetSchema}).then(function (result) {
      callback(null, result);
    }).catch(function (err) {
      callback(err);
    });
  }




}


module.exports = dbFunctions;