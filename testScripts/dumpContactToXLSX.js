const { Customer, CustomerSite, CustomerContact } = require('../appsrc/modules/crm/models');
const { Product, ProductModel } = require('../appsrc/modules/products/models');
const { SecurityUser } = require('../appsrc/modules/security/models');
const mongoose = require('../appsrc/modules/db/dbConnection');
const fs = require('fs');
const path = require('path');
const filePath = path.resolve(__dirname, "Contacts.csv");
async function main() {
	let finalData = ['Name,Title,Type,Customer,Phone,Email,Sites'];

	let contacts = await CustomerContact.find({isActive:true,isArchived:false})
							.populate('customer');

	contacts = JSON.parse(JSON.stringify(contacts));
	for(let contact of contacts) {
		
		if(Array.isArray(contact.sites) && contact.sites.length>0) {
			contact.sites = await CustomerSite.find({_id:{$in:contact.sites}});
			contact.sitesName = contact.sites.map((s)=>s.name);
			contact.sitesName = contact.sitesName.join('- ')
		}

		finalDataObj = {
			name:contact?getContactName(contact):'',
			title:contact.title?contact.title.replace(',' , '-'):'',
			types:contact.contactTypes?contact.contactTypes.join(' | ').replace(',','-'):'',
			customer:contact.customer?contact.customer.name.replace(',','-'):'',
			phone:contact.phone?contact.phone.replace(',' , '|'):'',
			email:contact.email?contact.email.replace(',' , '|'):'',
			sites:contact.sitesName?contact.sitesName.replace(',' , ' | '):'',
		};

		finalDataRow = Object.values(finalDataObj);

		finalDataRow = finalDataRow.join(', ');
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
	let fullName = '';

	if(contact && contact.firstName)
		fullName+= contact.firstName.replace(',','-');

	if(contact && contact.lastName)
		fullName+= contact.lastName.replace(',','-');

	return fullName;
}
main();