const Yup = require('yup');
const logger = require('../modules/config/logger');

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

const validateRequest = (schema) => async (req, res, next) => {
  try {
    if(!schema){
        throw new Error("Request Validation Failed!")
    }
    const { loginUser, ...otherFields } = req.body;
    
    // Validate and strip unknown fields
    const validatedBody = await schema.validate(otherFields, {
      abortEarly: false,
      stripUnknown: true,
      context: { reqId: req.params?.id },
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



module.exports = {
    getDocFromReq,
    validateRequest
}