const models = require('../asset/models');
const mongoose = require('mongoose');

class dbFunctions {
  constructor(model) {
    this.model = model;
  }

  getArray(fields, query, sort, order, callback) {
    this.model.find(query).exec((err, documents) => {
      if (err) {
        callback(err);
      } else {
        callback(null, documents);
      }
    });
  }


  saveObject(Object, callback) {
    Object.save((error, data) => {
      if (error) {
        console.error(error);
        callback(err);
      } else {
        callback(null, data);
      }
    });
  }


}


module.exports = dbFunctions;