const mongoose = require('mongoose');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');


class dbService {
  
  constructor() {
  }

  async getObjectById(model, fields, id, populate, callback) {
    //console.log('populate :'+populate);
    if(callback) {
      model.findById(id, fields).populate(populate).exec((err, documents) => {
        if (err) {
          callback(err, {});
        } else {
          callback(null, documents != null ? documents : {});
        }
      });
    }
    else {
      return await model.findById(id, fields).populate(populate);
    }
  }

  async getObject(model, query, populate, callback) {
    if(callback) {
      model.findOne(query).populate(populate).exec((err, document) => {
        if (err) {
          callback(err, {});
        } else {
          callback(null, document || {});
        }
      });
    }
    else {
      return await model.findOne(query).populate(populate);
    }
  }

  async getObjectList(model, fields, query, orderBy, populate, callback) {
    if(callback) {
      model.find(query).collation({locale: "en"}).select(fields).populate(populate).sort(orderBy).exec((err, documents) => {
        if (err) {
          callback(err, []);
        } else {
          callback(null, documents != null ? documents : []);
        }
      });
    }
    else {
      return await model.find(query).collation({locale: "en"}).select(fields).populate(populate).sort(orderBy);
    }
  }


  async getObjectListWithAggregate(model, aggregate, params, callback) {
    if(callback) {
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
    else {
      return await model.aggregate([aggregate]);
    }
  }

  async deleteObject(model, id, callback, res) {
    try {
      let existingRecord = await model.findById(id);
      if (!existingRecord.isArchived) {
        const error = new Error("Record cannot be deleted");
        error.statusCode = StatusCodes.BAD_REQUEST;
        throw error;
      }
  
      if (callback) {
        model.deleteOne({ _id: id }).then(function (result) {
          callback(null, result);
        }).catch(function (err) {
          throw err;
        });
      } else {
        return await model.deleteOne({ _id: id });
      }
    } catch (error) {
      if (error.statusCode) {
        if (res) {
          res.status(error.statusCode).send(error.message);
        } else {
          console.error('Res is missing');
        }
      } else {
        if (res) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
        } else {
          console.error('Res is missing');
        }
      }
    }
  }
  


  async postObject(Object, callback) {
    if(callback) {
      Object.save((error, data) => {
        if (error) {
          console.error(error);
          callback(error);
        } else {
          callback(null, data);
        }
      });
    }
    else {
      return await Object.save(); 
    }
  }

  async patchObject(model, id, Object, callback) {
    if(callback) {
      model.updateOne({ _id: id }, Object).then(function (doc) {
        //console.log("doc: "+JSON.stringify(doc) );
        callback(null, doc);
      }).catch(function (error) {
        console.error(error);
        callback(error);
      });
    }
    else{
      return await model.updateOne({ _id: id }, Object);
    }
  }
}


module.exports = dbService;