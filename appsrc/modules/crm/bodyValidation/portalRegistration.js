const { SecurityUser } = require('../../security/models');
const { PortalRegistration } = require('../../crm/models');
const Yup = require('yup');
const logger = require('../../config/logger');

const createPortalReqSchema = (reqType, req ) => {
    const isNewRequest = reqType === 'new';

    return Yup.object().shape({
        customerName: Yup.string().label('Customer Name').max(200).when([], {
            is: () => isNewRequest,
            then: (schema) => schema.required(),
            otherwise: (schema) => schema.notRequired(),
        }),
        contactPersonName: Yup.string().label('Contact Person Name').max(200).notRequired(),
        email: Yup.string().label('Email').email()
        .test('unique-email', async function (email) {
            const securityUser = await SecurityUser.findOne({ login: email, isArchived: false });
            if (securityUser) {
                return this.createError({
                    path: 'email',
                    message: 'Email already exists!',
                });
            }
        
            const portalRequest= await PortalRegistration.findOne({ email, isArchived: false }).lean();
            if ( portalRequest && portalRequest?._id?.toString() !== req?.params?.id?.toString() ) {
                return this.createError({
                    path: 'email',
                    message: `Portal Requests already exists against ${email}!`,
                });
            }
            return true;
        })
        .when([], {
            is: () => isNewRequest,
            then: (schema) => schema.required(),
            otherwise: (schema) => schema.notRequired(),
        }),
        phoneNumber: Yup.string().label('Phone Number').matches(/^[+0-9 ]+$/, 'Phone number must be digits only!').max(20).notRequired(),
        country: Yup.string().label('Country').max(255).nullable().notRequired(),
        address: Yup.string().label('Address').max(255).nullable().notRequired(),
        machineSerialNos: Yup.array().typeError("Invalid Machine Serial Nos!")
        .label('Machine Serial Nos')
        // .test( 'all-valid-serial-numbers','Each serial number must be exactly 6 digits',
        // (value) => !value || value?.every(serialNo => /^\d{6}$/.test(serialNo)))
        .when([], {
            is: () => isNewRequest,
            then: (schema) => schema.min(1, 'Machine Serial Numbers must have at least one value').required(),
            otherwise: (schema) => schema.notRequired(),
        }),
        status: Yup.string().label('Status').oneOf([ "NEW", "APPROVED", "REJECTED", "PENDING" ], 'Invalid status value').notRequired(),
        customer: Yup.string().label('Customer ID').max(50).nullable().notRequired(),
        contact: Yup.string().label('Contact ID').max(50).nullable().notRequired(),
        roles: Yup.array().label('Roles').nullable().notRequired(),
        customerNote: Yup.string().label('Customer Note').max(5000).nullable().notRequired(),
        internalNote: Yup.string().label('Internal Note').max(5000).nullable().notRequired(),
        isActive: Yup.boolean().nullable().notRequired(),
        isArchived: Yup.boolean().nullable().notRequired(),
    });
};

const validatePortalReq = (reqType) => {
    return async (req, res, next) => {
        try {
            const { loginUser, ...otherFields } = req.body;
            const portalReqSchema = createPortalReqSchema(reqType, req);
            const validatedBody = await portalReqSchema.validate(otherFields, {
                abortEarly: false,
                stripUnknown: true,
            });
            req.body = { ...validatedBody, loginUser };
            next(); 
        } catch (error) {
            logger.error(new Error(error));
            if (error instanceof Yup.ValidationError) {
                return res.status(400).json({
                    errors: error.inner.map(err => ({
                        field: err.path,
                        message: err.message
                    }))
                });
            }
            next(error);
        }
    };
};

module.exports = {
    validatePortalReq
};
