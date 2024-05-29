const { Customer, CustomerSite, CustomerContact } = require('../appsrc/modules/crm/models');
const { Product, ProductModel } = require('../appsrc/modules/products/models');
const { SecurityUser } = require('../appsrc/modules/security/models');
const mongoose = require('../appsrc/modules/db/dbConnection');
const fs = require('fs');
const path = require('path');
const filePath = path.resolve(__dirname, "Sites.csv");
async function main() {
	let finalData = ['Name,CustomerID,Customer,Street,Suburb,City,Region,PostCode,Country,Latitude,Longitude,Contacts,Billing Contact,Billing Contact ID,Technical Contact,Technical Contact ID'];

	let sites = await CustomerSite.find({isActive:true,isArchived:false})
							.populate('customer')
							.populate('primaryBillingContact')
							.populate('primaryTechnicalContact');

	sites = JSON.parse(JSON.stringify(sites));
	for(let site of sites) {
		if(site && site.customer && (site.customer.isActive==false || site.customer.isArchived==true)) 
			continue;
		
		if(Array.isArray(site.contacts) && site.contacts.length>0) {
			site.contacts = await CustomerContact.find({_id:{$in:site.contacts},isActive:true,isArchived:false});
			site.contactsName = site.contacts.map((c)=>`${c.firstName} ${c.lastName}`);
			site.contactsName = '"'+site.contactsName+'"'
		}

		finalDataObj = {
			name:site?'"'+site.name.replace(/"/g,"'")+'"':'',
			customerId:site.customer?site.customer._id:'',
			customer:site.customer?'"'+site.customer.name.replace(/"/g,"'")+'"':'',
			street:site.address?site.address.street?'"'+site.address.street.replace(/"/g,"'")+'"':'':'',
			suburb:site.address?site.address.suburb?'"'+site.address.suburb.replace(/"/g,"'")+'"':'':'',
			city:site.address?site.address.city?'"'+site.address.city.replace(/"/g,"'")+'"':'':'',
			region:site.address?site.address.region?'"'+site.address.region.replace(/"/g,"'")+'"':'':'',
			postCode:site.address?site.address.postcode?'"'+site.address.postcode.replace(/"/g,"'")+'"':'':'',
			country:site.address?site.address.country?'"'+site.address.country.replace(/"/g,"'")+'"':'':'',
			lat:site.lat?'"'+site.lat.replace(/"/g,"'")+'"':'',
			long:site.long?'"'+site.long.replace(/"/g,"'")+'"':'',
			contacts:site.contactsName?'"'+site.contactsName.replace(/"/g,"'")+'"':'',
			billingContact:site.primaryBillingContact?getContactName(site.primaryBillingContact):'',
			billingContactID:site.primaryBillingContact?site.primaryBillingContact._id:'',
			technicalContact:site.primaryTechnicalContact?getContactName(site.primaryTechnicalContact):'',
			technicalContactID:site.primaryTechnicalContact?site.primaryTechnicalContact._id:'',
		};

		finalDataRow = Object.values(finalDataObj);
		let index = 0;

		for(let finalData of finalDataRow) {
			finalData = finalData.replace(/(\r\n|\r|\n)/g,'');
			finalDataRow[index] = finalData;
			index++;
		}

		finalDataRow = finalDataRow.join(',');
		finalData.push(finalDataRow);

	}

	let csvDataToWrite = finalData.join('\n');

	fs.writeFile(filePath, csvDataToWrite, 'utf8', function (err) {
	  if (err) {
	    console.log('Some error occured - file either not saved or corrupted file saved.');
	  } else{
	    console.log('It\'s saved!');
	  }
	});
}


function getContactName(contact) {
	let fullName = '"';

	if(contact && contact.firstName)
		fullName+= contact.firstName.replace(/"/g,"'");

	if(contact && contact.lastName)
		fullName+= contact.lastName.replace(/"/g,"'");

	return fullName+'"';
}
main();