const { Product } = require('../../products/models');

module.exports = {
    id: [{ param: 'id', }],
    userID: [{ param: 'userID', }],
    customerId: [{ param: 'customerId' }],
    customerIdAndId: [{ param: 'customerId' }, { param: 'id' }],
    machine: [{ param: 'machineId' }, { model: Product }],
    machineId: [{ param: 'machineId' }],
    machineIdAndId: [{ param: 'machineId' }, { param: 'id' }]
};
