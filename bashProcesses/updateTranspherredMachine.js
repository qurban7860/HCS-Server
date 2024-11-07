const path = require("path");
const xlsx = require("xlsx");
const { Product, ProductStatus } = require('../appsrc/modules/products/models');
const { SecurityUser } = require('../appsrc/modules/security/models');
const mongoose__ = require('../appsrc/modules/db/dbConnection');
const mongoose = require('mongoose');
const parsePhoneNumber = require('libphonenumber-js');

async function main() {
	const listStatus = await ProductStatus.find({isActive: true, isArchived: false, slug: 'transferred' }).select('_id transferredDate transferredMachine').sort({_id: 1}).lean();

	const listProducts = await Product.find({    
		$or: [
        { transferredToMachine: { $exists: false } }, // transferredToMachine field does not exist
        { transferredToMachine: null } // transferredToMachine field is null
    	],
	 status: {$in: listStatus}, isArchived: false, isActive: false}).lean();

	for (const product of listProducts) {
		if(product.transferredMachine && product.transferredDate) {
			let queryString = { transferredToMachine: product.transferredMachine };
			queryString.globelMachineID = product._id;
			await Product.updateOne({ _id: product._id }, { $set:  queryString});
			
			delete queryString.transferredToMachine;
			queryString.transferredFromMachine = product._id;
			queryString.purchaseDate = product.transferredDate;
			
			console.log("-----------------------------------------------");
			await Product.updateOne({ _id: product.transferredMachine }, { $set: queryString});

		}



    }

}


main();
