const { SecurityUser } = require('../modules/security/models');
const { Customer } = require('../modules/crm/models');
const { Product } = require('../modules/products/models');

module.exports = async (req, res, next) => {
  let user = await SecurityUser.findById(req.body.loginUser.userId).select('regions customers machines dataAccessibilityLevel contact').lean();
  req.body.userInfo = user;
  console.log("user?.dataAccessibilityLevel", user?.dataAccessibilityLevel);
  console.log(user?.dataAccessibilityLevel !== 'GLOBAL');
  if (
    !req.body.loginUser?.roleTypes?.includes("SuperAdmin") &&
    user?.dataAccessibilityLevel !== 'GLOBAL' && 
    !req.body.loginUser?.roleTypes?.includes("Developer")
  ) {
    if (req.method === 'PATCH' && (req.body.isArchived == true || req.body.isArchived == 'true')) {
      return res.status(401).send("Unauthorized to execute archived functionality.");
    } else if(req.method === 'DELETE') {
      return res.status(401).send("Unauthorized to execute delete functionality.");
    }
  }

  if (
    !req.body.loginUser?.roleTypes?.includes("SuperAdmin") &&
    user?.dataAccessibilityLevel !== 'GLOBAL' &&
    !req.body.loginUser?.roleTypes?.includes("Developer") &&
     (
      req.url.includes('/customers') || req.url.includes('/machines')
    )
  ) {
    try {
      console.log("is not superadmin and global manager");
      
      const query___ = {
        $or: [
          { accountManager: req?.body?.userInfo?.contact },
          { projectManager: req?.body?.userInfo?.contact },
          { supportManager: req?.body?.userInfo?.contact }
        ]
      };
      let assignedCustomers = await Customer.findOne(query___).select('_id').lean();
      let assignedMachines = await Product.findOne(query___).select('_id').lean();

      if (
           (!user?.regions || user?.regions?.length === 0) 
        && (!user.customers || user?.customers?.length === 0) 
        && (!user.machines || user?.machines?.length === 0)
        && (assignedCustomers === undefined || assignedCustomers === null)
        && (assignedMachines === undefined || assignedMachines === null)
        ) {
        console.log("*** The user must be assigned to specific regions, customers, or machines");
        return res.status(400).send("The user must be assigned to specific regions, customers, or machines");
      } else {
        next();
        console.log("is not superadmin and global manager and assignment find.");
      }
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }
  } else {
    next();
  }
};


