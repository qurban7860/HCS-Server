const path = require("path");
const xlsx = require("xlsx");
const { Customer, CustomerSite, CustomerContact } = require('../appsrc/modules/crm/models');
const { SecurityUser } = require('../appsrc/modules/security/models');
const { Product, ProductConnection, ProductCategory, ProductModel, ProductTechParamValue, ProductTechParam, ProductTechParamCategory } = require('../appsrc/modules/products/models');
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

	for(let machine of machines) {
		if(machine && machine.EquipmentID) {
			let regExp = /\(([^)]+)\)/;
			let matches = regExp.exec(machine.EquipmentDescription);
			if(Array.isArray(matches) && matches.length>0) {
				let customerName = matches.ClientName;

				let machineSerialNo = machine.EquipmentID;
				console.log("machineSerialNo",machineSerialNo);
				
				if(typeof machineSerialNo == 'string')
					machineSerialNo = machine.EquipmentID.trim();

				let parentMachineSerialNo = matches[1].trim();

				console.log("parentMachineSerialNo",parentMachineSerialNo);

				let parentMachine = await Product.findOne({serialNo:parentMachineSerialNo});

				let machineDB = await Product.findOne({serialNo:machineSerialNo});

				if(parentMachine && parentMachine.id && machineDB && machineDB.id) {
			        	
					let machineConnection = await ProductConnection.findOne({ machineDB:parentMachine.id, connectedMachine : machineDB.id, isActive:true});

					if(!machineConnection) {
						let machineConnectionData = {
							machine:parentMachine.id,
							connectedMachine:machineDB.id
						}

						machineConnection = await ProductConnection.create(machineConnectionData);

					}

					if(!Array.isArray(parentMachine.machineConnections))
						parentMachine.machineConnections = [];
					
					if(parentMachine.machineConnections.indexOf(machineConnection.id)==-1) {
						parentMachine.machineConnections.push(machineConnection.id);
						await parentMachine.save();
					}

				}
				
			}
		}
	}
	console.log('Done')
}
main()