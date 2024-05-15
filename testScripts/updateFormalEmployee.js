const mongoose = require('mongoose');



const { SecurityUser } = require('../appsrc/modules/security/models');

const { CustomerContact } = require('../appsrc/modules/crm/models');

const util = require('util');



const mongoose__ = require('../appsrc/modules/db/dbConnection');
async function main() {
    const listUsers = await SecurityUser.find({ currentEmployee: true }).select('-_id contact').lean();
    const contactIds = listUsers.map(user => user.contact);
    const updatedRecords = await CustomerContact.updateMany(
        { _id: { $in: contactIds } },
        { $set: { formerEmployee: true } }
    );
    console.log({ updatedRecords });
}


main();