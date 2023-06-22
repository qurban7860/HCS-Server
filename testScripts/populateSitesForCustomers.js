const { Customer, CustomerSite, CustomerContact } = require('../appsrc/modules/crm/models');
const { Product, ProductCategory, ProductModel, ProductTechParamValue, ProductTechParam } = require('../appsrc/modules/products/models');
const mongoose = require('../appsrc/modules/db/dbConnection');

async function main() {

	let customers = await Customer.find({'sites.0':{$exists:false}});
	
	for(let customer of customers) {
		let site = await CustomerSite.findOne({name:customer.name,customer:customer.id});
		console.log('fetching site');
		
		if(!site) {
			site = await CustomerSite.create({
				name:customer.name,
				customer:customer.id
			});
			console.log('adding site');
		}

		if(site) {
			customer.sites.push(site.id);
			customer.mainSite = site.id;
			customer = await customer.save();
			let response = await Product.updateMany({customer:customer.id},{instalationSite:site.id})
			console.log(site.id,response);
		}
	}
}


main();