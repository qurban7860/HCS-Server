const path = require("path");
const xlsx = require("xlsx");
const { Customer, CustomerSite, CustomerContact } = require('../appsrc/modules/crm/models');
const { Product, ProductModel } = require('../appsrc/modules/products/models');
const { SecurityUser } = require('../appsrc/modules/security/models');
const mongoose = require('../appsrc/modules/db/dbConnection');

const filePath = path.resolve(__dirname, "123.xlsx");
// console.log(filePath)
const workbook = xlsx.readFile(filePath);
const sheetNames = workbook.SheetNames;
// console.log(sheetNames)
// Get the data of "Sheet1"
const machines = xlsx.utils.sheet_to_json(workbook.Sheets['MachinesCSV_20240130112913']);

async function main() {

	const howickCustomer = await Customer.findOne({type:'SP'});
	let index = 0;
  for(let machine of machines) {

    console.log(machine)
    if(machine.SerialNo) {
      let machineDB = await Product.findOne({serialNo:machine.SerialNo});
      if(machineDB && machineDB._id) {
      	
    		console.log("machine.AccountManager",machine.AccountManager);

      	if(machine.AccountManager && machine.AccountManager.length>2) {
	      	let accountContactData = {
	      		firstName:machine.AccountManager,
	      		customer:howickCustomer._id,
	      		isActive:true,
	      		isArchived:false
	      	}

	      	const accountContact = await CustomerContact.create(accountContactData);
    			console.log("machine.AccountManager",machine.AccountManager);
	  		
	      	if(!Array.isArray(machineDB.accountManager)) {
	      		machineDB.accountManager = [];
	      	}
      		machineDB.accountManager.push(accountContact._id);

      	}

      	if(machine.ProjectManager && machine.ProjectManager.length>2) {
	      	let projectContactData = {
	      		firstName:machine.ProjectManager,
	      		customer:howickCustomer._id,
	      		isActive:true,
	      		isArchived:false
	      	}

	      	const projectContact = await CustomerContact.create(projectContactData);
	  
	      	if(!Array.isArray(machineDB.projectManager)) {
	      		machineDB.projectManager = [];
	      	}
      		machineDB.projectManager.push(projectContact._id);

      	}

      	if(machine.SupportManager && machine.SupportManager.length>2) {
	      	let supportContactData = {
	      		firstName:machine.SupportManager,
	      		customer:howickCustomer._id,
	      		isActive:true,
	      		isArchived:false
	      	}

	      	const supportContact = await CustomerContact.create(supportContactData);
	  
	      	if(!Array.isArray(machineDB.supportManager)) {
	      		machineDB.supportManager = [];
	      	}
      		machineDB.supportManager.push(supportContact._id);

      	}
      	await machineDB.save();

      	console.log(machineDB);
      	console.log(index);

      	index++;
      	// break;
      }
    }
  }
  

  console.log('done')
}

main();
