
let dbService = require('../../db/dbService');

class ErrorDbService {
  constructor() {
    this.db = new dbService();
  }

  async getObject(model, query, populate) {
    return await this.db.getObject(model, query, populate);
  }

  async getObjectById(model, fields, id, populate) {
    return await this.db.getObjectById(model, fields, id, populate);
  }

  async getObjectList(req, model, fields, query, orderBy, populate) {
    return await this.db.getObjectList(req, model, fields, query, orderBy, populate);
  }

  async deleteObject(model, id, res, callback) {
    return await this.db.deleteObject(model, id, res);
  }

  async postObject(document) {
    return await this.db.postObject(document);
  }

  async patchObject(model, id, document) {
    return await this.db.patchObject(model, id, document);
  }
}


module.exports = ErrorDbService;