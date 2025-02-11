const { Customer } = require('../models');
const { CustomerContact } = require('../models');
const { CustomerSite } = require('../models');
const { CustomerNote } = require('../models');

module.exports = {
    id: [{ param: 'id', }],
    customer: [{ param: 'customerId', model: Customer }],
    customerId: [{ param: 'customerId' }],
    customerAndId: [{ param: 'customerId', model: Customer }, { param: 'id' }],
    customerIdAndId: [{ param: 'customerId' }, { param: 'id' }]
};
