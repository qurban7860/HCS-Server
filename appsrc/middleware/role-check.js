const { SecurityUser } = require('../modules/security/models');

module.exports = async (req, res, next) => {
  if (
    !req.body.loginUser?.roleTypes?.includes("SuperAdmin") &&
    !req.body.loginUser?.roleTypes?.includes("globalManager")
  ) {
    try {
      console.log("is not superadmin and global manager");
      let user = await SecurityUser.findById(req.body.loginUser.userId).select('regions').lean();
      req.body.userRegionInfo = user;

      if (!user?.regions || (user.regions && user.regions.length === 0)) {
        console.log("*** The user has not been assigned to any region.");
        return res.status(400).send("The user has not been assigned to any region.");
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


