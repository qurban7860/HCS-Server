const { CustomerRegistration } = require('../models');


function getDocumentFromReq(req, reqType) {
    const { customerName, contactPersonName, email, phoneNumber, machineSerialNos, isActive, isArchived, loginUser } = req.body;
    let doc = {};

    if (reqType && reqType == "new") {
        doc = new CustomerRegistration({});
    }

    if ("customerName" in req.body) {
        doc.customerName = customerName;
    }

    if ("contactPersonName" in req.body) {
        doc.contactPersonName = contactPersonName;
    }

    if ("email" in req.body) {
        doc.email = email;
    }

    if ("phoneNumber" in req.body) {
        doc.phoneNumber = phoneNumber;
    }

    if ("machineSerialNos" in req.body) {
        doc.machineSerialNos = machineSerialNos;
    }

    if ("address" in req.body) {
        doc.address = address;
    }

    if ("isActive" in req.body) {
        doc.isActive = isActive;
    }

    if ("isArchived" in req.body) {
        doc.isArchived = isArchived;
    }

    if (reqType == "new" && "loginUser" in req.body) {
        doc.createdBy = loginUser.userId;
        doc.updatedBy = loginUser.userId;
        doc.createdIP = loginUser.userIP;
        doc.updatedIP = loginUser.userIP;
    } else if ("loginUser" in req.body) {
        doc.updatedBy = loginUser.userId;
        doc.updatedIP = loginUser.userIP;
    }
    return doc;
}

module.exports = {
    getDocumentFromReq
}