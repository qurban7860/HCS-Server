
function getDocFromReq(req, reqType, Model ) {
    let doc;
    const loginUser  = req.body?.loginUser;
    delete req.body?.loginUser;

    if (reqType && reqType == "new") {
        if(!Model){
            throw new Error("Internal Server error")
        }
        doc = new Model({ ...req.body,
            createdBy: loginUser?.userId,
            updatedBy: loginUser?.userId,
            createdIP: loginUser?.userIP,
            updatedIP: loginUser?.userIP
        });
    } else {
        doc = { ...req.body,
            updatedBy: loginUser?.userId,
            updatedIP: loginUser?.userIP
        };
    }
    return doc;
}

module.exports = {
    getDocFromReq
}