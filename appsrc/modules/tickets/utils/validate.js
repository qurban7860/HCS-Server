const { Ticket } = require('../models');

module.exports = {
    ticket: [{ param: 'ticketId', model: Ticket }],
    ticketId: [{ param: 'ticketId' }],
    ticketAndId: [{ param: 'ticketId', model: Ticket }, { param: 'id' }],
    ticketIdAndId: [{ param: 'ticketId' }, { param: 'id' }]
};
