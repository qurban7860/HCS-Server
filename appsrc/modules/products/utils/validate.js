const { Product } = require('../models');

module.exports = {
    id: [{ param: 'id', model: Product }],
    machine: [{ param: 'machineId', model: Product }],
    machineId: [{ param: 'machineId' }],
    machineAndId: [{ param: 'machineId', model: Product }, { param: 'id' }],
    machineIdAndId: [{ param: 'machineId' }, { param: 'id' }],
    machineIdAndProfileId: [{ param: 'machineId' }, { param: 'profileId' }],
    machineIdProfileIdAndId: [{ param: 'machineId' }, { param: 'profileId' }, { param: 'id' }]
};
