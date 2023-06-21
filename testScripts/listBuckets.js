
const mongoose = require('../appsrc/modules/db/dbConnection');
const awsService = require('../appsrc/base/aws');

async function main() {
	let params = {
	  
	};

	let response = await awsService.listBuckets(params);
	console.log(response);

}

main();