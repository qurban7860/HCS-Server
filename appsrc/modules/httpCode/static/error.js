const STATIC_ERRORS = {
    CUSTOMER: {
        NOTAUTHORIZED: { code: 470, message: 'Customer is not authorized.' }
    },
    USER: {
        NOTAUTHORIZED: { code: 470, message: 'User is not authorized.' }
    },
    USERROLE: {
        ROLENOTAUTHORIZED: { code: 470, message: 'User role not authorized.' },
    },
    CONTACT: {
        NOTAUTHORIZED: { code: 470, message: 'Contact is not authorized.' }
    },
    APIACCESS: {
        NOTAUTHORIZED: { code: 403, message: 'API access not authorized..' }
    },
    PORTALACCESS: {
        NOTAUTHORIZED: { code: 403, message: 'Portal access not authorized.' }
    },
    IPACCESS: {
        NOTAUTHORIZED: { code: 403, message: 'IP access not authorized.' }
    },
};

module.exports = { STATIC_ERRORS }