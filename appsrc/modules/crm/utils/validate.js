const { Customer } = require('../models');
const { CustomerContact } = require('../models');
const { CustomerSite } = require('../models');
const { CustomerNote } = require('../models');
const { Department } = require('../models');

module.exports = {
    id: [{ param: 'id' }],
    idAndCustomer: [{ param: 'id', model: Customer }],
    customer: [{ param: 'customerId', model: Customer }],
    customerId: [{ param: 'customerId' }],
    customerAndId: [{ param: 'customerId', model: Customer }, { param: 'id' }],
    customerIdAndId: [{ param: 'customerId', model: Customer }, { param: 'id' }],
    departmentIdAndId: [{ param: 'id', model: Department }]
};
