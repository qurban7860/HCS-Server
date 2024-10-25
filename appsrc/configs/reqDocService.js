
function getDocFromReq(req, reqType, Model ) {
    const { loginUser, ...otherFields } = req.body;
    let doc;

    if (reqType && reqType == "new") {
        if(!Model){
            throw new Error("Internal Server error")
        }
        doc = new Model({ ...otherFields,
            createdBy: req?.body?.loginUser?.userId,
            updatedBy: req?.body?.loginUser?.userId,
            createdIP: req?.body?.loginUser?.userIP,
            updatedIP: req?.body?.loginUser?.userIP
        });
    } else {
        doc = { ...otherFields,
            updatedBy: req?.body?.loginUser?.userId,
            updatedIP: req?.body?.loginUser?.userIP
        };
    }
    return doc;
}

module.exports = {
    getDocFromReq
}