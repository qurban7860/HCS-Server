const path = require("path");
const xlsx = require("xlsx");
const { Customer, CustomerSite, CustomerContact } = require('../appsrc/modules/crm/models');
const { SecurityUser } = require('../appsrc/modules/security/models');
const { Product, ProductCategory, ProductModel, ProductTechParamValue, ProductTechParam, ProductTechParamCategory } = require('../appsrc/modules/products/models');
const mongoose = require('../appsrc/modules/db/dbConnection');

const filePath = path.resolve(__dirname, "migration3.xlsx");
// console.log(filePath)
const workbook = xlsx.readFile(filePath);
const sheetNames = workbook.SheetNames;
console.log(sheetNames)
// Get the data of "Sheet1"
const machines = xlsx.utils.sheet_to_json(workbook.Sheets['Export']);

console.log(machines);
async function main() {

  	let createdByUser = await SecurityUser.findOne({login:'naveed@terminustech.co.nz'});


	for(let machine of machines) {
		if(machine && machine.EquipmentID) {
			let serialNo = machine.EquipmentID;
			
			if(typeof serialNo == 'string')
				serialNo = machine.EquipmentID.trim();
			
			console.log(serialNo);
			let customerType = 'Customer';

			let customerName = machine.customerName;
			
			if(!serialNo)
				continue;

			if(customerName=="Howick") {
				let howickCustomer = await Customer.findById("640f20882b6cfb6f0a58eb87");

				dbMachine = await Product.updateOne({serialNo},{customer:howickCustomer.id,instalationSite:howickCustomer.mainSite});

				continue;
			}
			else {
				
				let name = machine.EquipmentDescription;

				let customer = await Customer.findOne({
					$or:[
						{ name : { $regex: customerName, $options: 'i' } },
						{ name : customerName },
					]
				});

				if(customer && customer.name) {
					console.log("customer",customer.name);
				}
				else {
					console.log('Not Found');
					customer = await Customer.create({
						name : customerName,
						tradingName: [customerName],
						type:customerType,
						contacts:[],
						sites:[],		
						createdBy:createdByUser.id,
						updatedBy:createdByUser.id,
						createdIP:"172.19.167.85",
						updatedIP:"172.19.167.85",
					});

						
					if(!customer) 
						continue;

					let billingSite = await CustomerSite.findOne({
				        name:customerName,
				        customer:customer.id,
			      	})

					if(!billingSite) {
		      	        billingSite = {
							name:customerName,
							customer:customer.id,
							address:{
								// city:'AuckLand',
								country:'New Zealand',
							},
							createdBy:createdByUser.id,
							updatedBy:createdByUser.id,
							createdIP:"172.19.167.85",
							updatedIP:"172.19.167.85",
						}

						billingSite = await CustomerSite.create(billingSite);
					}
					customer.sites.push(billingSite.id);
					customer.mainSite = billingSite.id;
					await customer.save();
					
				}

				dbMachine = await Product.updateOne({serialNo},{customer:customer.id,instalationSite:customer.mainSite});

				// let dbMachine = await Product.findOne({serialNo});
			}
			

			

		}
	}
	console.log('Done')

}

main();