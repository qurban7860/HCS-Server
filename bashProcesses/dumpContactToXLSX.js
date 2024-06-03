const { Customer, CustomerSite, CustomerContact } = require('../appsrc/modules/crm/models');
const { Product, ProductModel } = require('../appsrc/modules/products/models');
const { SecurityUser } = require('../appsrc/modules/security/models');
const mongoose = require('../appsrc/modules/db/dbConnection');
const fs = require('fs');
const path = require('path');
const filePath = path.resolve(__dirname, "Contacts.csv");
async function main() {
	let finalData = ['ID,Name,Title,Type,Customer ID,Customer,Phone,Email,Sites'];

	let contacts = await CustomerContact.find({isActive:true,isArchived:false})
							.populate('customer');

	contacts = JSON.parse(JSON.stringify(contacts));
	for(let contact of contacts) {
		
		if(contact && contact.customer && (contact.customer.isActive==false || contact.customer.isArchived==true)) 
			continue;

		if(Array.isArray(contact.sites) && contact.sites.length>0) {
			contact.sites = await CustomerSite.find({_id:{$in:contact.sites},isActive:true,isArchived:false});
			contact.sitesName = contact.sites.map((s)=>s.name);
			contact.sitesName = contact.sitesName.join('- ')
		}

		finalDataObj = {
			id:contact._id,
			name:contact?getContactName(contact):'',
			title:contact.title?'"'+contact.title.replace(/"/g,"'")+'"':'',
			types:contact.contactTypes?'"'+contact.contactTypes.join('|').replace(/"/g,"'")+'"':'',
			customerID:contact.customer?contact.customer._id:'',
			customer:contact.customer?'"'+contact.customer.name.replace(/"/g,"'")+'"':'',
			phone:contact.phone?'"'+contact.phone.replace(/"/g,"'")+'"':'',
			email:contact.email?'"'+contact.email.replace(/"/g,"'")+'"':'',
			sites:contact.sitesName?'"'+contact.sitesName.replace(/"/g,"'")+'"':'',
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
	let fullName = '"';

	if(contact && contact.firstName)
		fullName+= contact.firstName.replace(/"/g,"'");

	if(contact && contact.lastName)
		fullName+= contact.lastName.replace(/"/g,"'");

	return fullName+'"';
}
main();