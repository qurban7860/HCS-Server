
let ticketDBService = require('../service/ticketDBService')
this.dbservice = new ticketDBService();

const { Customer, CustomerSite } = require('../../crm/models');
const { Product } = require('../../products/models');
const { SecurityUser } = require('../../security/models');
const { Region } = require('../../regions/models');
const { Country } = require('../../config/models');

async function applyTicketFilter(req) {
    try {
        if (!req.query.unfiltered) {
            if (
                !req.body.loginUser?.roleTypes?.includes("SuperAdmin") &&
                req?.body?.userInfo?.dataAccessibilityLevel !== 'GLOBAL' &&
                !req.body.loginUser?.roleTypes?.includes("Developer")
            ) {
                let user = await SecurityUser.findById(req.body.loginUser.userId).select(
                    'regions customers machines'
                ).lean();

                if (user) {
                    let finalQuery = {
                        $or: []
                    };

                    // region
                    if (Array.isArray(user.regions) && user.regions.length > 0) {
                        let regions = await Region.find({ _id: { $in: user.regions } }).select(
                            'countries'
                        ).lean();
                        let countries = [];
                        let countryNames = [];
                        let customerSites = [];

                        for (let region of regions) {
                            if (Array.isArray(region.countries) && region.countries.length > 0)
                                countries = [...region.countries];
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

                        let mainSiteQuery = { $in: customerSites };
                        let customerAllowed = await Customer.find(query___).select('_id').lean();

                        if (customerAllowed && customerAllowed.length > 0) {
                            finalQuery.$or.push({ customer: { $in: customerAllowed } });
                        }
                    }

                    // customer
                    if (Array.isArray(user.customers) && user.customers.length > 0) {
                        let idQuery = { $in: user.customers };
                        finalQuery.$or.push({ customer: idQuery });
                    }

                    //machine
                    if (Array.isArray(user.machines) && user.machines.length > 0) {
                        let listProducts = await Product.find({ _id: { $in: user.machines } }).select(
                            'customer'
                        ).lean();
                        const listCustomers = listProducts.map((item) => item.customer);
                        let idQuery = { $in: listCustomers };
                        finalQuery.$or.push({ customer: idQuery });
                    }

                    // project, support and account manager query.
                    if (req?.body?.userInfo?.contact) {
                        const query___ = {
                            $or: [
                                { accountManager: req?.body?.userInfo?.contact },
                                { projectManager: req?.body?.userInfo?.contact },
                                { supportManager: req?.body?.userInfo?.contact }
                            ]
                        };
                        let customerAllowed = await Customer.find(query___).select('_id').lean();

                        if (customerAllowed && customerAllowed.length > 0) {
                            finalQuery.$or.push({ customer: { $in: customerAllowed } });
                        }

                        // Allowed customer from machines.
                        const productCustomers = await Product.find(query___).select('-_id customer').lean();
                        const customerIds = productCustomers.map(customer => customer.customer);
                        if (customerIds && customerIds.length > 0) {
                            finalQuery.$or.push({ customer: { $in: customerIds } });
                        }
                    }

                    if (finalQuery && finalQuery.$or.length > 0) {
                        return finalQuery;
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            }
        } else {
            delete req.query.unfiltered;
            return null;
        }
    } catch (e) {
        console.log("filter error : ", e)
    }
}

module.exports = applyTicketFilter;