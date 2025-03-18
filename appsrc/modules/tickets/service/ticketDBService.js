let dbService = require('../../db/dbService');


class TicketService {
  constructor() {
    this.db = new dbService();
  }

  async getObject(model, query, populate) {
    try {
      const response = await this.db.getObject(model, query, populate);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getObjectById(model, fields, id, populate) {
    try {
      const response = await this.db.getObjectById(model, fields, id, populate);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getObjectList(req, model, fields, query, orderBy, populate) {
    try {
      const response = await this.db.getObjectList(req, model, fields, query, orderBy, populate);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async deleteObject(model, id, res, callback) {
    try {
      if (callback) {
        this.db.deleteObject(model, id, res, callbackFunc);
        function callbackFunc(error, response) {
          if (error) callback(error, {});
          else callback(null, response);
        }
      } else {
        return await this.db.deleteObject(model, id, res);
      }
    } catch (error) {
      throw error;
    }
  }

  async postObject(document) {
    try {
      const response = await this.db.postObject(document);
      return response;
    }
    catch (error) {
      throw error;
    }
  }

  async patchObject(model, id, document) {
    try {
      const response = await this.db.patchObject(model, id, document);
      return response;
    }
    catch (error) {
      throw error;
    }
  }


  async getCountsByGroups({
    model,
    field,
    localField = null,
    subField = null,
    isSubFieldValue = false,
    collectionName,
    localFieldCollectionName = null,
    subFieldCollectionName = null,
    propertiesToRetrieve = ["name"],
    isResolved = null,
    startDate
  }) {
    try {
      if (!field) throw new Error("Field is required for aggregation");

      const matchStage = {
        isArchived: false,
        isActive: true,
      };

      const filterResolvedStage = isResolved !== null ? {
        $match: { [`${subField}Data.isResolved`]: JSON.parse(isResolved) },
      } : null;

      if (startDate) {
        matchStage.createdAt = { $gte: new Date(startDate) };
      }

      const lookupStages = [];

      if (localField && localFieldCollectionName) {
        lookupStages.push({
          $lookup: {
            from: localFieldCollectionName,
            localField: localField,
            foreignField: "_id",
            as: `${localField}Data`,
          },
        });
      }

      if (subField && subFieldCollectionName && localField) {
        lookupStages.push({
          $lookup: {
            from: subFieldCollectionName,
            localField: `${localField}Data.${subField}`,
            foreignField: "_id",
            as: `${subField}Data`,
          },
        });
      }

      const pipeline = [
        { $match: matchStage },
        ...lookupStages,
      ];

      if (localField) {
        pipeline.push({ $unwind: { path: `$${localField}Data`, preserveNullAndEmptyArrays: true } });
      }

      if (subField) {
        pipeline.push({ $unwind: { path: `$${subField}Data`, preserveNullAndEmptyArrays: true } });
      }

      pipeline.push({
        $lookup: {
          from: collectionName,
          localField: field,
          foreignField: "_id",
          as: `${field}Data`,
        },
      });
      pipeline.push({ $unwind: { path: `$${field}Data`, preserveNullAndEmptyArrays: true } });
      pipeline.push(...(filterResolvedStage ? [filterResolvedStage] : []));

      const groupStage = {
        $group: {
          _id: `$${isSubFieldValue ? subField : field}Data._id`,
          count: { $sum: 1 },
        }
      };

      propertiesToRetrieve.forEach(property => {
        groupStage.$group[property] = { $first: `$${isSubFieldValue ? subField : field}Data.${property}` };
      });

      pipeline.push({
        $facet: {
          countsByField: [
            {
              ...groupStage
            },
            { $sort: { count: -1 } },
          ],
          totalCount: [{ $count: "total" }],
        }
      });

      const result = await model.aggregate(pipeline);
      const countsByField = result[0]?.countsByField || [];
      const totalCount = result[0]?.totalCount?.[0]?.total || 0;

      return { countsByField, totalCount };
    }
    catch (error) {
      throw error;
    }
  }

}

module.exports = TicketService;