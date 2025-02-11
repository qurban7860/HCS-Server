const { Product } = require('../models');

module.exports = {
    id: [{ param: 'id', }],
    machine: [{ param: 'machineId', model: Product }],
    machineId: [{ param: 'machineId' }],
    machineAndId: [{ param: 'machineId', model: Product }, { param: 'id' }],
    machineIdAndId: [{ param: 'machineId' }, { param: 'id' }]
};
