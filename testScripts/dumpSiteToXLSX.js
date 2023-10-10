const { Customer, CustomerSite, CustomerContact } = require('../appsrc/modules/crm/models');
const { Product, ProductModel } = require('../appsrc/modules/products/models');
const { SecurityUser } = require('../appsrc/modules/security/models');
const mongoose = require('../appsrc/modules/db/dbConnection');
const fs = require('fs');
const path = require('path');
const filePath = path.resolve(__dirname, "Customers.csv");
async function main() {
	let finalData = ['Name,Code,Trading Name,Type,Main Site, Main Site ID,Sites,Contacts,Billing Contact,Billing Contact ID,Technical Contact,Technical Contact ID,Account Manager, Account Manager ID,Project Manager,Project Manager ID,Support Subscription, Support Manager, Support Manager ID'];

	let customers = await Customer.find({isActive:true,isArchived:false})
							.populate('mainSite')
							.populate('primaryBillingContact')
							.populate('primaryTechnicalContact')
							.populate('accountManager')
							.populate('projectManager')
							.populate('supportManager');

	customers = JSON.parse(JSON.stringify(customers));
	for(let customer of customers) {
		
		if(Array.isArray(customer.sites) && customer.sites.length>0) {
			customers.sites = await CustomerSite.find({_id:{$in:customer.sites}});
			customers.sitesName = customers.sites.map((s)=>s.name);
			customers.sitesName = customers.sitesName.join('- ')
		}

		if(Array.isArray(customer.contacts) && customer.contacts.length>0) {
			customers.contacts = await CustomerContact.find({_id:{$in:customer.contacts}});
			customers.contactsName = customers.contacts.map((c)=>`${c.firstName} ${c.lastName}`);
			customers.contactsName = customers.contactsName.join('- ')
		}

		finalDataObj = {
			name:customer.name?customer.name.replace(',' , '-'):'',
			clientCode:customer.clientCode?customer.clientCode.replace(',' , '-'):'',
			tradingName:customer.tradingName?customer.tradingName.join('- ').replace(',' , '-'):'',
			type:customer.type,
			mainSite:customer.mainSite?customer.mainSite.name.replace(',' , ' | '):'',
			mainSiteID:customer.mainSite?customer.mainSite.id:'',
			sites:customer.sitesName?customer.sitesName.replace(',' , ' | '):'',
			contacts:customer.contactsName?customer.contactsName.replace(',' , ' | '):'',
			billingContact:customer.primaryBillingContact?getContactName(customer.primaryBillingContact):'',
			billingContactID:customer.primaryBillingContact?customer.primaryBillingContact.id:'',
			technicalContact:customer.primaryTechnicalContact?getContactName(customer.primaryTechnicalContact):'',
			technicalContactID:customer.primaryTechnicalContact?customer.primaryTechnicalContact.id:'',
			accountManager:customer.accountManager?getContactName(customer.accountManager):'',
			accountManagerID:customer.accountManager?customer.accountManager.id:'',
			projectManager:customer.projectManager?getContactName(customer.projectManager):'',
			projectManagerID:customer.projectManager?customer.projectManager.id:'',
			supportSubscription:customer.supportSubscription?'Yes':'No',
			supportManager:customer.supportManager?getContactName(customer.supportManager):'',
			supportManagerID:customer.supportManager?customer.supportManager.id:'',
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