
module.exports = (propertiesToRemove) => (req, res, next) => {
    if ((req.method === "POST" || req.method === "PATCH") && Array.isArray(propertiesToRemove)) {
        propertiesToRemove.forEach((prop) => {
            if (req.body.hasOwnProperty(prop)) {
                delete req.body[prop];
            }
        });
    }
    next();
};

