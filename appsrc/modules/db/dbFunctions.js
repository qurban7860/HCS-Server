const models = require('../asset/models');
const mongoose = require('mongoose');

class dbFunctions {
  constructor(model) {
    this.model = model;
  }

  getObjectById(fields, id, callback) {
    this.model.findById(id, fields).exec((err, documents) => {
      if (err) {
        callback(err);
      } else {
        callback(null, documents);
      }
    });
  }

  getObjectList(fields, query, orderBy, callback) {
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


  patchObject(id, scheme, callback) {
    models.Assets.updateOne({ _id: id}, scheme).then(function (doc) {
      callback(null, doc);
    }).catch(function (err) {
      callback(err);
    });
  }
}


module.exports = dbFunctions;