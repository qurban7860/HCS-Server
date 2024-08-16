const { CustomerContact } = require("../models");
let customerDBService = require("../service/customerDBService");
const dbservice = new customerDBService();

async function getAllSPCustomerContacts() {
  var aggregate = [
    {
      $lookup: {
        from: "Customers",
        localField: "customer",
        foreignField: "_id",
        as: "customer",
      },
    },
    {
      $match: {
        "customer.type": "SP",
        "customer.isActive": true,
        "customer.isArchived": false,
      },
    },
    {
      $sort: {
        firstName: 1,
        lastName: 1,
      },
    },
    {
      $lookup: {
        from: "CustomerContacts",
        localField: "_id",
        foreignField: "_id",
        as: "contact",
      },
    },
    {
      $match: {
        "contact.isActive": true,
        "contact.isArchived": false,
      },
    },
    {
      $unwind: "$contact",
    },
    {
      $project: {
        _id: 1,
        email: "$contact.email",
        contactId: "$contact._id",
      },
    },
  ];

  var params = {};
  const results = await dbservice.getObjectListWithAggregate(CustomerContact, aggregate, params);
  return results;
}

module.exports = getAllSPCustomerContacts;
