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

  getObjectList(fields, query, orderBy, populate, callback) {
    this.model.find(query, fields).populate(populate).sort(orderBy).exec((err, documents) => {
      if (err) {
        callback(err, []);
      } else {
        callback(null, documents != null ? documents : []);
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


module.exports = dbService;