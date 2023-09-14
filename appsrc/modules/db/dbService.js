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
      const document = await model.findById(id, fields).populate(populate);
      return document != null ? document : {};
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
    const collationOptions = {
      locale: 'en',
      strength: 2
    };

    if(callback) {
      model.find(query).collation(collationOptions).select(fields).populate(populate).sort(orderBy).exec((err, documents) => {
        if (err) {
          callback(err, []);
        } else {
          callback(null, documents != null ? documents : []);
        }
      });
    }
    else {
      return await model.find(query).collation(collationOptions).select(fields).populate(populate).sort(orderBy);
    }
  }


  async getObjectListWithAggregate(model, aggregate, params, callback) {
    const collationOptions = {
      locale: 'en',
      strength: 2
    };
    if(callback) {
      model.aggregate([
        aggregate
      ]).collation(collationOptions).exec((err, documents) => {
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

  async deleteObject(model, id, res, callback) {
    try {
      
      let existingRecord = await model.findById(id);
     
      if(existingRecord == null) {
        console.log("----------------------------------------------------------------");
        const error = new Error("Invalid record");
        error.statusCode = StatusCodes.BAD_REQUEST;
        throw error;
      } else if (!existingRecord.isArchived) {
        const error = new Error("Record cannot be deleted. It should be archived first!");
        error.statusCode = StatusCodes.BAD_REQUEST;
        throw error;
      }

      
  
      if (callback) {
      
        model.deleteOne({ _id: id }).then(function (result) {
          callback(null, result);
        }).catch(function (err) {
          callback(err);
        });
      } else {
   
        return await model.deleteOne({ _id: id });
      }
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).send(error.message);
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
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
      console.log("Object -->", Object);
      return await model.updateOne({ _id: id }, Object);
    }
  }
}


module.exports = dbService;