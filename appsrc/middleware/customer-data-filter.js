const { SecurityUser } = require('../modules/security/models');
const { Customer } = require('../modules/crm/models');
const { ReasonPhrases, StatusCodes } = require('http-status-codes');
const logger = require('../modules/config/logger');

/**
 * Response middleware to filter data based on user's customer access and role
 * This ensures users can only access data related to their own customer and authorized scope
 * NOTE: Currently disabled for review and refinement of filtering logic
 */
const customerDataFilter = async (req, res, next) => {
    // Temporarily disabled - pass through all requests
    return next();
    
    // // Store the original send function
    // const originalSend = res.send;

    // try {
    //     if (req.method !== 'GET') {
    //         return next();
    //     }

    //     const user = req.body.loginUser;
    //     if (!user) {
    //         return res.status(StatusCodes.UNAUTHORIZED).send(ReasonPhrases.UNAUTHORIZED);
    //     }

    //     const userDetails = await SecurityUser.findById(user.userId)
    //         .populate('customer')
    //         .populate('roles')
    //         .populate('customers')
    //         .populate('machines')
    //         .select('customer roles dataAccessibilityLevel customers machines');

    //     if (!userDetails) {
    //         return res.status(StatusCodes.UNAUTHORIZED).send(ReasonPhrases.UNAUTHORIZED);
    //     }

    //     const hasAdminRole = userDetails.roles.some(role => 
    //         role.roleType === 'SuperAdmin' || role.roleType === 'Developer'
    //     );

    //     if (hasAdminRole || userDetails.dataAccessibilityLevel === 'GLOBAL') {
    //         return next();
    //     }

    //     res.send = function (data) {
    //         try {
    //             let responseData = JSON.parse(typeof data === 'string' ? data : JSON.stringify(data));
                
    //             if (userDetails.customer) {
    //                 const path = req.path.toLowerCase();
    //                 const customerId = userDetails.customer._id.toString();
    //                 const allowedCustomerIds = [
    //                     customerId,
    //                     ...(userDetails.customers || []).map(c => c._id.toString())
    //                 ];
    //                 const allowedMachineIds = (userDetails.machines || []).map(m => m._id.toString());

    //                 const filterObject = (obj) => {
    //                     if (!obj) return obj;

    //                     if (obj.customer) {
    //                         const objCustomerId = obj.customer._id 
    //                             ? obj.customer._id.toString() 
    //                             : obj.customer.toString();
                            
    //                         if (!allowedCustomerIds.includes(objCustomerId)) {
    //                             return null;
    //                         }
    //                     }

    //                     if (obj.machine) {
    //                         const machineId = obj.machine._id 
    //                             ? obj.machine._id.toString() 
    //                             : obj.machine.toString();
                            
    //                         if (!allowedMachineIds.includes(machineId)) {
    //                             return null;
    //                         }
    //                     }

    //                     return obj;
    //                 };

    //                 const filterData = (data) => {
    //                     if (Array.isArray(data)) {
    //                         return data
    //                             .map(item => filterObject(item))
    //                             .filter(item => item !== null);
    //                     } else {
    //                         return filterObject(data);
    //                     }
    //                 };

    //                 if (path.includes('/customers')) {
    //                     responseData = filterData(responseData);
    //                 } 
    //                 else if (path.includes('/sites')) {
    //                     responseData = filterData(responseData);
    //                 }
    //                 else if (path.includes('/contacts')) {
    //                     responseData = filterData(responseData);
    //                 }
    //                 else if (path.includes('/machines')) {
    //                     responseData = filterData(responseData);
    //                 }
    //                 else if (path.includes('/productlogs')) {
    //                     responseData = filterData(responseData);
    //                 }
    //             }

    //             arguments[0] = responseData ? JSON.stringify(responseData) : '[]';
    //             originalSend.apply(res, arguments);
    //         } catch (error) {
    //             logger.error(new Error(error));
    //             originalSend.call(res, data);
    //         }
    //     };

    //     next();
    // } catch (error) {
    //     logger.error(new Error(error));
    //     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(ReasonPhrases.INTERNAL_SERVER_ERROR);
    // }
};

module.exports = customerDataFilter; 