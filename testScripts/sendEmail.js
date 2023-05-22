const mongoose = require('../appsrc/modules/db/dbConnection');
const awsService = require('../appsrc/base/aws');

async function main() {
	let params = {
	  to:"owaistariq8@gmail.com",
	  subject:"test email",
	  body:`we are testing email `
	};

	let response = await awsService.sendEmail(params);
	console.log(response);

	let buckets = await awsService.listBuckets({});
	console.log(buckets);
}

main();