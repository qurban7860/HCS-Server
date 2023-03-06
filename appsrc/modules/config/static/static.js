const { getReasonPhrase } = require('http-status-codes');

module.exports = {
    recordDelMessage(code, results) {
        if (code == 200) {
            if (results != undefined && results.deletedCount > 0) {
                return results.deletedCount + " records successfully deleted!"
            } else {
                return "No records deleted!";
            }
        } else {
            return getReasonPhrase(code);
        }
    },
    recordUpdateMessage(code, results) {
        if (code == 200) {
            if (results != undefined && results.nModified > 0) {
                return results.nModified + " records successfully updated!"
            } else {
                return "No records updated!";
            }
        } else {
            return getReasonPhrase(code);
        }
    },
    recordMissingParamsMessage(parent ,code) {
        if (code == 400) {
            const response = {
                statusCode: code,
                message: `Insufficients params received. ${parent} ID required!`
            };

            return response;
        } else {
            return getReasonPhrase(code);
        }
    }
};