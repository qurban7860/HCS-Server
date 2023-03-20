const models = require('../assets/models');
const mongoose = require('mongoose');

class dbService {
  
  constructor() {
  }

  getObjectById(model, fields, id, populate, callback) {
    //console.log('populate :'+populate);

    model.findById(id, fields).populate(populate).exec((err, documents) => {
      if (err) {
        callback(err, {});
      } else {
        callback(null, documents != null ? documents : {});
      }
    });
  }

  getObject(model, query, populate, callback) {
    model.findOne(query).populate(populate).exec((err, document) => {
      if (err) {
        callback(err, {});
      } else {
        callback(null, document || {});
      }
    });
  }

  getObjectList(model, fields, query, orderBy, populate, callback) {
    model.find(query).collation({locale: "en"}).select(fields).populate(populate).sort(orderBy).exec((err, documents) => {
      if (err) {
        callback(err, []);
      } else {
        callback(null, documents != null ? documents : []);
      }
    });
  }


  getObjectListWithAggregate(model, aggregate, params, callback) {
    model.aggregate([
      aggregate
    ]).exec((err, documents) => {
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

  patchObject(model, id, Object, callback) {
    model.updateOne({ _id: id }, Object).then(function (doc) {
      //console.log("doc: "+JSON.stringify(doc) );
      callback(null, doc);
    }).catch(function (error) {
      console.error(error);
      callback(error);
    });
  }
}


module.exports = dbService;