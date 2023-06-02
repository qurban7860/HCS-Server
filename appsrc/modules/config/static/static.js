const { getReasonPhrase } = require('http-status-codes');

module.exports = {
    recordCustomMessage(code, message){
        if (message) {
            return message;
        } else {
            return getReasonPhrase(code);
        }
    },
    recordCustomMessageJSON(code, message, isError){
        if (message){
            const response = {
                isError: isError, 
                MessageCode: code,
                Message: message
            };

            return response;
        } else {
            return getReasonPhrase(code);
        }
    },
    recordDelMessage(code, results) {
        if (code == 200) {
            if (results != undefined && results.deletedCount > 0) {
                return results.deletedCount + " records successfully deleted!"
            } else {
                return "No records deleted!";
            }
        } else if (code == 409) {
            return "Cannot delete the record as it has references in child collections.";
        } else {
            return getReasonPhrase(code);
        }
    },
    recordUpdateMessage(code, results, action) {
        if (code == 200) {
            if (results != undefined && results.nModified > 0) {
                return results.nModified + " records successfully updated!"
            } else {
                return "No records updated!";
            }
        } else if (code == 202 && action == 'passwordChange') {
            if (results != undefined && results.nModified > 0) {
                return "Your password has been updated successfully."
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
    recordInvalidParamsMessage(code) {
        if (code == 400) {
            const response = {
                isError: "true", 
                MessageCode: code,
                Message: `Invalid params received!`
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
                Message: 'Could not log you in, please check your credentials and try again'
            };

            return response;
        } else {
            return getReasonPhrase(code);
        }
    },
    recordSchemaVaidationFaliureMessage(code, message = ''){
        if (code == 500) {
            const response = {
                isError: "true", 
                MessageCode: code,
                Message: `Schema Validation Error ${message}`
            };

            return response;
        } else {
            return getReasonPhrase(code);
        }
    },
    recordInvalidCustomerTypeMessage(code){
        if (code == 403) {
            const response = {
                isError: "true", 
                MessageCode: code,
                Message: 'Login failed. Only Service Provider (SP) Users are allowed to access'
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
    },
    recordTransferInvalidMessage(code) {
        if (code == 400) {
            const response = {
                isError: "true", 
                MessageCode: code,
                Message: `In-transfer machines cannot be transferred!`
            };

            return response;
        } else {
            return getReasonPhrase(code);
        }
    },
};