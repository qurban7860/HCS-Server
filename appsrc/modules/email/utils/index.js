// index.js

const {
    filterAndDeduplicateEmails,
    verifyEmail,
    renderEmail,
    emailDataComposer,
    rawEmailDataComposer,
    structureEmail,
    structureRawEmail
} = require('./util');

module.exports = {
    filterAndDeduplicateEmails,
    verifyEmail,
    renderEmail,
    emailDataComposer,
    rawEmailDataComposer,
    structureEmail,
    structureRawEmail
};
