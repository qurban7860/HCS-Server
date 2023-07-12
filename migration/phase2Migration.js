const path = require("path");
const xlsx = require("xlsx");
const { Customer, CustomerSite, CustomerContact } = require('../appsrc/modules/crm/models');
const { SecurityUser } = require('../appsrc/modules/security/models');
const { Product, ProductCategory, ProductModel, ProductTechParamValue, ProductTechParam, ProductTechParamCategory } = require('../appsrc/modules/products/models');
const mongoose = require('../appsrc/modules/db/dbConnection');

const filePath = path.resolve(__dirname, "migration2New.xlsx");
// console.log(filePath)
const workbook = xlsx.readFile(filePath);
const sheetNames = workbook.SheetNames;
// console.log(sheetNames)
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
			if(!serialNo)
				continue;
			let name = machine.EquipmentDescription;
			let customerName = machine.ClientID;

			if(machine.ClientName && machine.ClientName.length>0) {
				customerName = machine.ClientName;
			}
			
			let customerType = 'Customer';
			let dbMachine = await Product.findOne({serialNo});
			if(!dbMachine) {
				let insertMachine = {
					serialNo,
					name,
					createdBy:createdByUser.id,
					updatedBy:createdByUser.id,
					createdIP:"172.19.167.85",
					updatedIP:"172.19.167.85",
				}

				let customer = await Customer.findOne({
					name:{$in:[customerName,machine.ClientName]},
			        type:customerType
				})
				
				
				let machineModelName = machine.EquipmentCategory;

				if(!customer) {
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

					
				}

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

				if(machine.ClientName && machine.ClientName.length>0) {
					customer.name = machine.ClientName;
					customer.tradingName = [machine.ClientName,customerName];
					await customer.save();
				}

				insertMachine.customer = customer.id;

				let machineCategoryName = machine.EquipmentGroup;
				
				console.log("machineModelName",machineModelName,"machineCategoryName",machineCategoryName)
				let machineCategory = await ProductCategory.findOne({
					name:machineCategoryName
				});

				console.log("machineCategory",machineCategory);

				let machineModel;
				if(!machineCategory) {

					let connections = false;
					if(name.toLowerCase().indexOf('decoiler')>-1)
						connections = true;
					
					machineCategory = await ProductCategory.create({
						name:machineCategoryName,
						description:machineCategoryName,
						connections,
						createdBy:createdByUser.id,
						updatedBy:createdByUser.id,
						createdIP:"172.19.167.85",
						updatedIP:"172.19.167.85",
					});

					console.log("machineCategory2",machineCategory);

				}

				machineModel = await ProductModel.findOne({
					name:machineModelName,
					category:machineCategory.id,
				})

				console.log("machineModel",machineModel);


				if(!machineModel) {
					
					machineModel = await ProductModel.create({
						name:machineModelName,
						description:machineModelName,
						category:machineCategory.id,
						createdBy:createdByUser.id,
						updatedBy:createdByUser.id,
						createdIP:"172.19.167.85",
						updatedIP:"172.19.167.85",
					})

					console.log("machineModel 2",machineModel);


				}
				

				insertMachine.machineModel = machineModel.id;
				insertMachine.instalationSite = customer.mainSite.toString();
				
				if(machine.ShippingDate && machine.ShippingDate.length>0) {
					console.log("machine.ShippingDate",machine.ShippingDate);
					let shippingDateYear = machine.ShippingDate.substring(0, 4);
					let shippingDateMonth = machine.ShippingDate.substring(4, 6);
					let shippingDateDay = machine.ShippingDate.substring(6, 8);
					insertMachine.shippingDate = new Date(`${shippingDateYear}-${shippingDateMonth}-${shippingDateDay}`);

				}

				if(machine.InstallationDate && machine.InstallationDate.length>0) {
					console.log("machine.InstallationDate",machine.InstallationDate);

					let shippingDateYear = machine.InstallationDate.substring(0, 4);
					let shippingDateMonth = machine.InstallationDate.substring(4, 6);
					let shippingDateDay = machine.InstallationDate.substring(6, 8);
					insertMachine.installationDate = new Date(`${shippingDateYear}-${shippingDateMonth}-${shippingDateDay}`);
				}

				if(!insertMachine.installationDate && insertMachine.shippingDate) {
					insertMachine.installationDate = insertMachine.shippingDate;
				}

				if(!insertMachine.shippingDate && insertMachine.installationDate) {
					insertMachine.shippingDate = insertMachine.installationDate;
				}				

				insertMachine.status = "642607ab7ce0781e19dc2b22"
				console.log(insertMachine);
				// if(serialNo=='21039')
				// 	process.exit();
				dbMachine = await Product.create(insertMachine);


			}
			let keys = Object.keys(machine);
			let validKeys = ['Computer','ElectricalControl','HLCSoftwareVersion','MachineControl','MachineSoftwareLicence','PLCFirmwareVersion','PLCSoftwareVersion','TouchScreen'];
			for(let validKey of validKeys) {
				let techParam = machine[validKey];
				if(techParam && techParam!='...' && techParam!='..') {
					
					let machineTechParam = await ProductTechParam.findOne({name:{ $regex: validKey, $options: 'i' }});
					if(!machineTechParam) {
						let machineTechParamCategory = await ProductTechParamCategory.findOne({name:{ $regex: validKey, $options: 'i' }});
						if(!machineTechParamCategory) {
							machineTechParamCategory = await ProductTechParamCategory.create({
								name:validKey,
								description:validKey
							});
						}
						machineTechParam = await ProductTechParam.create({
							name:validKey,
							description:validKey,
							code:validKey,
							category:machineTechParamCategory.id
						});
					}
					
					let productTechParamValue = await ProductTechParamValue.findOne({
						machine : dbMachine.id,
						techParam:machineTechParam.id,
						techParamValue:{ $regex: techParam, $options: 'i' }
					});

					if(!productTechParamValue) {
						productTechParamValue = await ProductTechParamValue.create({
							machine : dbMachine.id,
							techParam:machineTechParam.id,
							techParamValue:techParam
						});
					}
				}
			}

		}
	}
	console.log('Done')

}

main();