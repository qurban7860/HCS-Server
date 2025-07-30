const { SecurityUser } = require('../modules/security/models');
const { Customer } = require('../modules/crm/models');
const { Product } = require('../modules/products/models');
const { Region } = require('../modules/regions/models');
const { Country } = require('../modules/config/models');
const { CustomerSite } = require('../modules/crm/models');

const logger = require('../modules/config/logger');

module.exports = async (req, res, next) => {
  
  let user = await SecurityUser.findById(req.body.loginUser.userId)
  .select('customer regions customers machines dataAccessibilityLevel contact')
  .populate({ path: 'customer', select: 'name type isActive isArchived' }).lean();
  req.body.userInfo = user;
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
      logger.error(new Error("is not super admin and global manager"));
      let assignedCustomers=[];
      let assignedMachines=[];
      let customerSites = [];

      if (Array.isArray(user.regions) && user.regions.length > 0) {
        let regions = await Region.find({ _id: { $in: user.regions } }).select(
            'countries'
        ).lean();
        let countries = [];
        let countryNames = [];

        for (let region of regions) {
            if (Array.isArray(region.countries) && region.countries.length > 0)
                countries = [...countries, ...region.countries];
        }

        if (Array.isArray(countries) && countries.length > 0) {
            let countriesDB = await Country.find({ _id: { $in: countries } }).select(
                'country_name'
            ).lean();

            if (Array.isArray(countriesDB) && countriesDB.length > 0)
                countryNames = countriesDB.map((c) => c.country_name);
        }

        if (Array.isArray(countryNames) && countryNames.length > 0) {
            let customerSitesDB = await CustomerSite.find(
                { "address.country": { $in: countryNames } }
            ).select('_id').lean();

            if (Array.isArray(customerSitesDB) && customerSitesDB.length > 0)
                customerSites = customerSitesDB.map((site) => site._id);
        }
      }

      if(customerSites.length > 0){
        // assigned sites to loginUser
        req.body.loginUser.authorizedSites = customerSites;
        
        const customerQuery = {
            mainSite: {$in: customerSites},
            _id: {$in: req.body.userInfo.customers}
        }

        // getting site customers
        const customers = await Customer.find(customerQuery).select('_id').lean();
        assignedCustomers = customers.map(customer => customer._id);

        if(req?.body?.userInfo?.machines.length === 0){
          // getting site machines
          const machines = await Product.find({customer: {$in: assignedCustomers}}).select('_id').lean();
          assignedMachines = machines.map(machine => machine._id);
        }
      
      }
      
      if(req?.body?.userInfo?.customers.length > 0){
        assignedCustomers = req?.body?.userInfo?.customers;
        
        if(req?.body?.userInfo?.machines.length === 0){
          // getting customer machines
          const machines = await Product.find({customer: {$in: assignedCustomers}}).select('_id').lean();
          assignedMachines = [...assignedMachines, ...machines.map(machine => machine._id)];
        }
      }

      if(req?.body?.userInfo?.machines.length > 0){
        assignedMachines = [...assignedMachines, ...req?.body?.userInfo?.machines];
      }
        
      req.body.loginUser.authorizedCustomers = assignedCustomers;
      req.body.loginUser.authorizedMachines = assignedMachines;

      if (
           (!user?.regions || user?.regions?.length === 0) 
        && (!user.customers || user?.customers?.length === 0) 
        && (!user.machines || user?.machines?.length === 0)
        && (assignedCustomers === undefined || assignedCustomers === null)
        && (assignedMachines === undefined || assignedMachines === null)
        ) {
        logger.error(new Error("*** The user must be assigned to specific regions, customers, or machines"));
        return res.status(400).send("The user must be assigned to specific regions, customers, or machines");
      } else {
        logger.error(new Error("is not super admin and global manager and assignment find."));
        next();
      }
    } catch (error) {
      logger.error(new Error(error));
      return res.status(500).send("Internal Server Error");
    }
  } else {
    next();
  }
};


