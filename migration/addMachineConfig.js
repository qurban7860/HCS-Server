const path = require("path");
const xlsx = require("xlsx");
const { Product, ProductTechParamValue, ProductTechParam } = require('../appsrc/modules/products/models');
const { SecurityUser } = require('../appsrc/modules/security/models');
const mongoose = require('../appsrc/modules/db/dbConnection');

const filePath = path.resolve(__dirname, "migrationXlsx.xlsx");
// console.log(filePath)
const workbook = xlsx.readFile(filePath);
const sheetNames = workbook.SheetNames;
const machinesHeaders = xlsx.utils.sheet_to_json(workbook.Sheets['Machines'],{header:1})[0];
const machines = xlsx.utils.sheet_to_json(workbook.Sheets['Machines']);

let machineConfigs = machinesHeaders.filter((h)=>h.indexOf('__c')>-1);

async function main() {
	let validConfigs = [];
	for(let config of machineConfigs) {
		config = config.replace('__c','');
		let conf = await ProductTechParam.findOne({name:{ $regex: config, $options: 'i' }});
		if(conf) {
			validConfigs.push({_id:conf.id,name:config+'__c'});
		}
	}


	let createdByUser = await SecurityUser.findOne({login:'naveed@terminustech.co.nz'});
	for(let machine of machines) {
		let machineDB = await Product.findOne({serialNo:machine.SerialNumber});
		console.log(machineDB.serialNo,machineDB.id);
		if(machineDB) {
			for(let validConfig of validConfigs) {
				let configValue = machine[validConfig.name];
				if(configValue && configValue.length>2) {
					
					let machineTechParamValue =  await ProductTechParamValue.findOne({
						machine:machineDB.id,
						techParam:validConfig._id,
						techParamValue:configValue,
					});
					if(!machineTechParamValue) {
						machineTechParamValue = {
							machine:machineDB.id,
							techParam:validConfig._id,
							techParamValue:configValue,
							createdBy:createdByUser.id,
							updatedBy:createdByUser.id,
						}
						machineTechParamValue = await ProductTechParamValue.create(machineTechParamValue);
					}
				}
			}
		}
	}
	console.log('done')

}


main();