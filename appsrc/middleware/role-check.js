const { SecurityUser } = require('../modules/security/models');
const { Customer } = require('../modules/crm/models');
const { Product } = require('../modules/products/models');
const { Region } = require('../modules/regions/models');
const { Country } = require('../modules/config/models');
const { CustomerSite } = require('../modules/crm/models');

const logger = require('../modules/config/logger');

module.exports = async (req, res, next) => {
  
  let user = await SecurityUser.findById(req.body.loginUser.userId)
  .select('customer regions customers dataAccessibilityLevel contact')
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
      let assignedCustomers=req?.body?.userInfo?.customers || [];
      let assignedSites = [];

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
                assignedSites = customerSitesDB.map((site) => site._id);
        }
      }

      if(assignedSites.length > 0){
        // assigned sites to loginUser
        
        const siteQuery = {
            mainSite: {$in: assignedSites},
            _id: {$in: assignedCustomers}
        }

        // getting site customers if not assigned
        const customers = await Customer.find(siteQuery).select('_id').lean();
        const siteCustomers = customers.map(customer => customer._id);
        assignedCustomers = [...assignedCustomers, ...siteCustomers];
      }
        
      req.body.loginUser.customerQuery = getAuthorizedCustomerQuery(assignedCustomers, assignedSites, req.body.loginUser.contact);
      req.body.loginUser.machineQuery = getAuthorizedMachineQuery(assignedCustomers, assignedSites, req.body.loginUser.contact);
      req.body.loginUser.siteQuery = getAuthorizedSiteQuery(assignedCustomers, assignedSites, req.body.loginUser.contact);

      if (
           (!user?.regions || user?.regions?.length === 0) 
        && (!user.customers || user?.customers?.length === 0)
        && (assignedCustomers === undefined || assignedCustomers === null)
        ) {
        logger.error(new Error("*** The user must be assigned to specific regions or customers"));
        return res.status(400).send("The user must be assigned to specific regions or customers");
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

const getAuthorizedMachineQuery = function(authorizedCustomers=[], authorizedSites=[], contact) {

  let query;

  let authorizedQuery = [];
  if (authorizedSites.length > 0) {
    authorizedQuery.push({ instalationSite: { $in: authorizedSites } });
  }

  if (authorizedCustomers.length > 0) {
    authorizedQuery.push({ customer: { $in: authorizedCustomers } });
  }

  authorizedQuery.push({ accountManager: contact });
  authorizedQuery.push({ projectManager: contact });
  authorizedQuery.push({ supportManager: contact });

  query = { $or: authorizedQuery };

  return query;
}

const getAuthorizedCustomerQuery = function(authorizedCustomers=[], authorizedSites=[], contact) {

  let query;

  let authorizedQuery = [];
  if (authorizedSites.length > 0) {
    authorizedQuery.push({ mainSite: { $in: authorizedSites } });
  }

  if (authorizedCustomers.length > 0) {
    authorizedQuery.push({ _id: { $in: authorizedCustomers } });
  }

  authorizedQuery.push({ accountManager: contact });
  authorizedQuery.push({ projectManager: contact });
  authorizedQuery.push({ supportManager: contact });

  query = { $or: authorizedQuery };

  return query;
}

const getAuthorizedSiteQuery = function(authorizedCustomers=[], authorizedSites=[], contact) {

  let query;

  let authorizedQuery = [];
  if (authorizedSites.length > 0) {
    authorizedQuery.push({ _id: { $in: authorizedSites } });
  }

  if (authorizedCustomers.length > 0) {
    authorizedQuery.push({ customer: { $in: authorizedCustomers } });
  }

  authorizedQuery.push({ primaryBillingContact: contact });
  authorizedQuery.push({ primaryTechnicalContact: contact });

  query = { $or: authorizedQuery };

  return query;
}



