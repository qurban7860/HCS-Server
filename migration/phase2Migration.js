const path = require("path");
const xlsx = require("xlsx");
const { Customer, CustomerSite, CustomerContact } = require('../appsrc/modules/crm/models');
const { SecurityUser } = require('../appsrc/modules/security/models');
const { Product, ProductCategory, ProductModel, ProductTechParamValue, ProductTechParam } = require('../appsrc/modules/products/models');
const mongoose = require('../appsrc/modules/db/dbConnection');

const filePath = path.resolve(__dirname, "migration2.xlsx");
// console.log(filePath)
const workbook = xlsx.readFile(filePath);
const sheetNames = workbook.SheetNames;
// console.log(sheetNames)
// Get the data of "Sheet1"
const machines = xlsx.utils.sheet_to_json(workbook.Sheets['Export']);

console.log(machines);
async function main() {

	for(let machine of machines) {
		if(machine && machine.EquipmentID) {
			let serialNo = machine.EquipmentID.trim();
			console.log(serialNo);
			if(!serialNo)
				continue;
			let name = machine.EquipmentDescription;
			let customerName = machine.ClientID;
			let customerType = 'Customer';
			let dbMachine = await Product.findOne({serialNo});
			if(!dbMachine) {
				let insertMachine = {
					serialNo,
					name,
				}

				let customer = await Customer.findOne({
					name:{ $regex: customerName, $options: 'i' },
			        tradingName: customerName,
			        type:customerType
				})
				
				let machineModelName = machine.EquipmentCategory;

				if(!customer) {
					customer = await Customer.create({
						name : customerName,
						tradingName: customerName,
						type:customerType,
						contacts:[],
						sites:[],		
					});

				}

				if(!customer) 
					continue;

				insertMachine.customer = customer.id;

				let machineCategoryName = machine.EquipmentGroup;

				let machineCategory = await ProductCategory.findOne({
					name:{ $regex: machineCategoryName, $options: 'i' }

				});
				let machineModel;
				if(!machineCategory) {

					let connections = false;
					if(name.toLowerCase().indexOf('decoiler')>-1)
						connections = true;
					
					machineCategory = await ProductCategory.create({
						name:machineCategoryName,
						description:machineCategoryName,
						connections
					});

					machineModel = await ProductModel.findOne({
						name:{ $regex: machineModelName, $options: 'i' }

					})

					console.log("machineCategoryName1",machineCategoryName);


					if(!machineModel) {
						
						machineModel = await ProductModel.create({
							name:machineModelName,
							description:machineModelName,
							category:machineCategory.id,
						})

					}
				}
				else {
					console.log(machineCategory.id)
					machineModel = await ProductModel.findOne({
						category:machineCategory.id
					})	

					console.log("machineCategoryName",machineCategoryName);
					if(!machineModel) {
						machineModel = await ProductModel.findOne({
							name:{ $regex: machineModelName, $options: 'i' }
						})							
					}

					if(!machineModel) {
						

					

						machineModel = await ProductModel.create({
							name:machineModelName,
							description:machineModelName,
							category:machineCategory.id,
						})

					}		


					console.log('here else')	
				}

				insertMachine.machineModel = machineModel.id;
				console.log(insertMachine);
				dbMachine = await Product.create(insertMachine);


			}
			// let keys = Object.keys(machine);
			// let validKeys = ['Computer','ElectricalControl','HLCSoftwareVersion','MachineControl','MachineSoftwareLicence','PLCFirmwareVersion','PLCSoftwareVersion','TouchScreen'];
			// for(let validKey of validKeys) {
			// 	let techParam = machine[validKey];
			// 	if(techParam && techParam!='...' && techParam!='..') {
					
			// 		let machineTechParam = await ProductTechParam.findOne({name:{ $regex: validKey, $options: 'i' }});
			// 		// if(!machineTechParam) {
			// 		// 	let ProductTechParamCategory = 
			// 		// }
			// 	}
			// }
			
		}
	}
}

main();