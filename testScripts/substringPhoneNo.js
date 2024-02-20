const path = require("path");
const xlsx = require("xlsx");
const { Customer, CustomerSite, CustomerContact } = require('../appsrc/modules/crm/models');
const { Product, ProductModel } = require('../appsrc/modules/products/models');
const { SecurityUser } = require('../appsrc/modules/security/models');
const mongoose__ = require('../appsrc/modules/db/dbConnection');
const mongoose = require('mongoose');
const parsePhoneNumber = require('libphonenumber-js');

async function main() {

	const listSites = await CustomerSite.find({isActive: true, isArchived: false}).select('_id phone').lean();
	let parsedNumbers = [];
	let unparsedNumbers = [];
	for(let site of listSites) {
		if(site?.phone !== undefined && site?.phone?.trim().length > 0 && site?.phone?.trim().replace(/-/g, '').length > 3) {
			const parsedNumber = parsePhoneNumber(site.phone);
			if(parsedNumber) {
				let phoneNumber = {
					site_id: site._id,
					phone: site.phone,
					type: "PHONE",
					countryCode:parsedNumber.countryCallingCode,
					number:parsedNumber.nationalNumber,
					country: parsedNumber.country
				}
				parsedNumbers.push(phoneNumber);
				console.log("Country Code:", parsedNumber.countryCallingCode);
				console.log("Number:", parsedNumber.nationalNumber);
				console.log();
				let arrayList = [];
				arrayList.push(phoneNumber);
				await CustomerSite.updateOne({_id: site._id},{$set: {phoneNumbers: arrayList}});
				
			} else {
				let phoneNumber_ = {
					_id: site._id,
					phone: site.phone
				}
				unparsedNumbers.push(phoneNumber_);
				console.log("********", site.phone);
			}

			// const { countryCode, phoneNumber } = splitPhoneNumber(site.phone.replace(/-/g, ' '));
			// console.log(site.phone);
		}
 	 }
	  console.log(parsedNumbers.length, parsedNumbers);
	  console.log(unparsedNumbers.length, unparsedNumbers);
	 
  

}

function splitPhoneNumber(phone) {
	let regex = /^\+(\d+)\s(.+)$/;
	// regex = /^\+(\d{1,3})\s?(\d+)$/;
	
	const match = phone.match(regex);
	if (match) {
	  return {
		countryCode: match[1],
		phoneNumber: match[2]
	  };
	} else {
        // if (phone.length >= 12) {
		// 	console.log("phone ---****", phone);
        //     return {
        //         countryCode: phone.substring(0, 3),
        //         phoneNumber: phone.substring(3)
        //     };
        // } else {
		// 	console.log("phone --->", phone);
        //     return {
        //         countryCode: '',
        //         phoneNumber: ''
        //     };
        // }

		            return {
                countryCode: '',
                phoneNumber: ''
            };
	}
  }

main();
