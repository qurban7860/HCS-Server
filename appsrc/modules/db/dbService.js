const models = require('../assets/models');
const mongoose = require('mongoose');

class dbService {
  constructor() {
  }

  getObjectById(model, fields, id, populate, callback) {
    model.findById(id, fields).populate(populate).exec((err, documents) => {
      if (err) {
        callback(err, {});
      } else {
        callback(null, documents != null ? documents : {});
      }
    });
  }

  getObjectList(model, fields, query, orderBy, callback) {
    model.find(query, fields).sort(orderBy).exec((err, documents) => {
      if (err) {
        callback(err, []);
      } else {
        callback(null, documents != null ? documents : []);
      }
    });
  }

  deleteObject(model, id, callback) {
    model.deleteOne({ _id: id }).then(function (result) {
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

  patchObject(model, id, scheme, callback) {
    model.updateOne({ _id: id }, scheme).then(function (doc) {
      callback(null, doc);
    }).catch(function (err) {
      callback(err);
    });
  }
}


module.exports = dbService;