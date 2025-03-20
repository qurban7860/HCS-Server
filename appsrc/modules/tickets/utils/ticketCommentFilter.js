let ticketDBService = require('../service/ticketDBService')
this.dbservice = new ticketDBService();

const { SecurityUser } = require('../../security/models');

async function applyTicketCommentFilter(req) {
    try {
        let user = await SecurityUser.findById(req.body.loginUser.userId)
            .select('regions customers machines').populate([{ path: 'customer', select: 'name type' }]).lean();
        let finalQuery = null
        if (user && user?.customer?.type?.toLowerCase() !== "sp") {
            finalQuery = { isInternal: false };
        }
        return finalQuery;
    } catch (e) {
        console.log("filter error : ", e)
    }
}

module.exports = applyTicketCommentFilter;