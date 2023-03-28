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
    recordMissingParamsMessage(code, parent) {
        if (code == 400) {
            const response = {
                isError: "true", 
                MessageCode: code,
                Message: `Insufficients params received. ${parent} ID required!`
            };

            return response;
        } else {
            return getReasonPhrase(code);
        }
    },
    recordDuplicateRecordMessage(code) {
        if (code == 400) {
            const response = {
                isError: "true", 
                MessageCode: code,
                Message: `Duplicate entry found!`
            };

            return response;
        } else {
            return getReasonPhrase(code);
        }
    },
    recordInvalidCredenitalsMessage(code){
        if (code == 403) {
            const response = {
                isError: "true", 
                MessageCode: code,
                Message: 'Could not log you in, please check your credentials and try again.'
            };

            return response;
        } else {
            return getReasonPhrase(code);
        }
    },
    invalidIdMessage(code, parent) {
        if (code == 404) {
            const response = {
                isError: "true", 
                MessageCode: code,
                Message: `${parent} ID not found!`
            };

            return response;
        } else {
            return getReasonPhrase(code);
        }
    },
    recordLogoutMessage(code){
        if (code == 200) {
            const response = {
                isError: "false", 
                MessageCode: code,
                Message: "Logout successfully"
            };

            return response;
        } else {
            return getReasonPhrase(code);
        }
    }
};