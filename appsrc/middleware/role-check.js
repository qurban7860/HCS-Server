const { SecurityUser } = require('../modules/security/models');

module.exports = async (req, res, next) => {
  console.log("role check.... *****");
  if (
    !req.body.loginUser?.roleTypes?.includes("SuperAdmin") &&
    !req.body.loginUser?.roleTypes?.includes("GlobalManager") && 
    !req.body.loginUser?.roleTypes?.includes("Developer")
  ) {
    if (req.method === 'PATCH' && (req.body.isArchived == true || req.body.isArchived == 'true')) {
      return res.status(401).send("Unauthorized to execute archived functionality.");
    } else if(req.method === 'DELETE') {
      return res.status(401).send("Unauthorized to execute delete functionality.");
    }
  }

  console.log("req.url", req.url);
  if (
    !req.body.loginUser?.roleTypes?.includes("SuperAdmin") &&
    !req.body.loginUser?.roleTypes?.includes("GlobalManager") &&
    !req.body.loginUser?.roleTypes?.includes("Developer") &&
     (
      req.url.includes('/customers') || req.url.includes('/products')
    )
  ) {
    try {
      console.log("is not superadmin and global manager");
      let user = await SecurityUser.findById(req.body.loginUser.userId).select('regions customers machines').lean();
      req.body.userRegionInfo = user;

      if ((!user?.regions || user?.regions?.length === 0) && (!user.customers || user?.customers?.length === 0) && (!user.machines || user?.machines?.length === 0)) {
        console.log("*** The user must be assigned to specific regions, customers, or machines");
        return res.status(400).send("The user must be assigned to specific regions, customers, or machines");
      } else {
        next();
        console.log("is not superadmin and global manager and region is assigned.");
      }
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }
  } else {
    next();
  }
};


