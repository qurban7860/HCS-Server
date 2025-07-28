const { Customer, CustomerSite } = require('../crm/models');
const { Product } = require('../products/models');
const { SecurityUser } = require('../security/models');
const { Region } = require('../regions/models');
const { Country } = require('../config/models');

async function processUserRoles(req) {

  if (!req.query.unfiltered) {
    if (
      !req.body.loginUser?.roleTypes?.includes("SuperAdmin") &&
      req?.body?.loginUser?.dataAccessibilityLevel !== 'GLOBAL' &&
      !req.body.loginUser?.roleTypes?.includes("Developer")
    ) {
      let user = await SecurityUser.findById(req.body.loginUser.userId).select(
        "regions customers machines contact"
      ).lean();

      if (user) {
        let finalQuery = {
          $or: [],
        };

        if (Array.isArray(user.regions) && user.regions.length > 0) {
          let regions = await Region.find({ _id: { $in: user.regions } })
            .select("countries")
            .lean();

          let countries = [];
          let countryNames = [];
          let customerSites = [];

          for (let region of regions) {
            if (
              Array.isArray(region.countries) &&
              region.countries.length > 0
            ) {
              countries = [...region.countries];
            }
          }

          if (Array.isArray(countries) && countries.length > 0) {
            let countriesDB = await Country.find({
              _id: { $in: countries },
            }).select("country_name").lean();

            if (Array.isArray(countriesDB) && countriesDB.length > 0)
              countryNames = countriesDB.map((c) => c.country_name);
          }

          let listCustomers__ = [];
          if (Array.isArray(countryNames) && countryNames.length > 0) {
            customerSitesDB = await CustomerSite.find({
              "address.country": { $in: countryNames },
            }).select("_id").lean();

            if (Array.isArray(customerSitesDB) && customerSitesDB.length > 0)
              customerSites = customerSitesDB.map((site) => site._id);

            listCustomers__ = await Customer.find({
              mainSite: { $in: customerSites },
            }).select("_id").lean();
          }

          let customerQuery = { $in: listCustomers__ };
          finalQuery.$or.push({ customer: customerQuery });

          if (Array.isArray(customerSites) && customerSites.length > 0) {
            let customers = await Customer.find({
              mainSite: { $in: customerSites },
            }).lean();
            if (Array.isArray(customers) && customers.length > 0) {
              let customerIDs = customers.map((customer) => customer._id);
              finalQuery.$or.push({ customer: customerIDs });
            }
          }
        }

        if (Array.isArray(user.machines) && user.machines.length > 0) {
          let idQuery = { $in: user.machines };
          finalQuery.$or.push({ _id: idQuery });
        }

        if (Array.isArray(user.customers) && user.customers.length > 0) {
          let customerQuery = { $in: user.customers };
          finalQuery.$or.push({ customer: customerQuery });
        }

        // project, support and account manager query.
        if (req?.body?.userInfo?.contact) {
          // Allowed customer from machines.
          const query___ = {
            $or: [
              { accountManager: req?.body?.userInfo?.contact },
              { projectManager: req?.body?.userInfo?.contact },
              { supportManager: req?.body?.userInfo?.contact }
            ]
          };

          // Allowed by customer
          let customerAllowed = await Customer.find(query___).select('_id').lean();
          const customerIds = customerAllowed.map(customer => customer._id);
          if (customerIds && customerIds.length > 0)
            finalQuery.$or.push({ customer: { $in: customerIds } });

          // Allowed Machines
          const productCustomers = await Product.find(query___).select('_id').lean();
          if (productCustomers && productCustomers.length > 0) {
            finalQuery.$or.push({ _id: { $in: productCustomers } });
          }
        }

        if (finalQuery.$or.length > 0) {
          return finalQuery;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else {
      delete req.query.unfiltered;
      return null
    }
  } else {
    return false;
  }
}

module.exports = processUserRoles;