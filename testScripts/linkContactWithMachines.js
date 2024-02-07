const path = require("path");
const xlsx = require("xlsx");
const { Customer, CustomerSite, CustomerContact } = require('../appsrc/modules/crm/models');
const { Product, ProductModel } = require('../appsrc/modules/products/models');
const { SecurityUser } = require('../appsrc/modules/security/models');
const mongoose__ = require('../appsrc/modules/db/dbConnection');
const mongoose = require('mongoose');
const filePath = path.resolve(__dirname, "MachinesCSV_20240130112913.xlsx");
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

    // console.log(machine)
    if(machine.SerialNo) {
      let machineDB = await Product.findOne({serialNo:machine.SerialNo});
      if(machineDB && machineDB._id) {

		let nameValue_ = machine.AccountManager ? machine.AccountManager.trim() : "";
      	if(nameValue_ && nameValue_.length>2) {
			let accountContactQuery_ = {
			  customer:howickCustomer._id,
			  isActive: true,
			  isArchived: false,
			  $or: [{firstName:nameValue_}]
			}			

			if(nameValue_ && nameValue_.split(" ").length == 2) {
				let acctManger = nameValue_.split(" ");
				accountContactQuery_.$or.push(
					{$and: [{ firstName: acctManger[0] }, { lastName: acctManger[1] }]}
				);
			}

	      	let accountContact = await CustomerContact.findOne(accountContactQuery_).sort({_id: 1});

			if(accountContact) {
				console.log("accountContact --->", accountContact.firstName, accountContact.lastName);
			} else {
				console.log("************************accountContact NOT FOUND*****************************************");
			}

	      	if(!accountContact) {

		      	let accountContactData = {
		      		firstName:nameValue_,
		      		customer:howickCustomer._id,
		      		isActive:true,
		      		isArchived:false
		      	}

		      	accountContact = await CustomerContact.create(accountContactData);
	      	}

    			console.log("nameValue_",nameValue_);
	  		
	      	if(!Array.isArray(machineDB.accountManager)) {
	      		machineDB.accountManager = [];
	      	}

	      	if(machineDB.accountManager.indexOf(accountContact._id)==-1) {
      			machineDB.accountManager = [accountContact._id];
	      	}
      	}

      	if(machine.ProjectManager && machine.ProjectManager.length>2) {

			let nameValue_ = machine.ProjectManager.trim();
			let queryString = {
				customer:howickCustomer._id,
				isActive: true,
				isArchived: false,
				$or: [{firstName:nameValue_}]
			}			
  
			if(nameValue_ && nameValue_.split(" ").length == 2) {
				let managerValue = nameValue_.split(" ");
				queryString.$or.push(
					{$and: [{ firstName: managerValue[0] }, { lastName: managerValue[1] }]}
				);
			}
			
      		let projectContact = await CustomerContact.findOne(queryString);

			if(projectContact) {
				console.log("projectContact --->", projectContact.firstName, projectContact.lastName);
			} else {
				console.log("************************projectContact NOT FOUND*****************************************");
			}

	      	if(!projectContact) {

		      	let projectContactData = {
		      		firstName:machine.ProjectManager,
		      		customer:howickCustomer._id,
		      		isActive:true,
		      		isArchived:false
		      	}

		      	projectContact = await CustomerContact.create(projectContactData);
	  			}

	      	if(!Array.isArray(machineDB.projectManager)) {
	      		machineDB.projectManager = [];
	      	}

	      	if(machineDB.projectManager.indexOf(projectContact._id)==-1) {
      			// machineDB.projectManager.push(projectContact._id);
				machineDB.projectManager = [projectContact._id]
			}

      	}

      	if(machine.SupportManager && machine.SupportManager.length>2) {
			let nameValue_ = machine.SupportManager.trim();
			let queryString = {
				customer:howickCustomer._id,
				isActive: true,
				isArchived: false,
				$or: [{firstName:nameValue_}]
			}			
  
			if(nameValue_ && nameValue_.split(" ").length == 2) {
				let managerValue = nameValue_.split(" ");
				queryString.$or.push(
					{$and: [{ firstName: managerValue[0] }, { lastName: managerValue[1] }]}
				);
			}

      		let supportContact = await CustomerContact.findOne(queryString);

			if(supportContact) {
				console.log("supportContact --->", supportContact.firstName, supportContact.lastName);
			} else {
				console.log("************************supportContact NOT FOUND*****************************************");
			}

	      	if(!supportContact) {

		      	let supportContactData = {
		      		firstName:machine.SupportManager,
		      		customer:howickCustomer._id,
		      		isActive:true,
		      		isArchived:false
		      	}

		      	supportContact = await CustomerContact.create(supportContactData);
	      	}
	  
	      	if(!Array.isArray(machineDB.supportManager)) {
	      		machineDB.supportManager = [];
	      	}

	      	if(machineDB.supportManager.indexOf(supportContact._id)==-1) {
      			// machineDB.supportManager.push(supportContact._id);
				machineDB.supportManager = [supportContact._id]
			}
      	}

      	if(!Array.isArray(machineDB.accountManager)) {
      		if(mongoose.Types.ObjectId.isValid(machineDB.accountManager)) {
      			machineDB.accountManager = [machineDB.accountManager];
      		}
      	}

      	if(!Array.isArray(machineDB.projectManager)) {
      		if(mongoose.Types.ObjectId.isValid(machineDB.projectManager)) {
      			machineDB.projectManager = [machineDB.projectManager];
      		}
      	}

      	if(!Array.isArray(machineDB.supportManager)) {
      		if(mongoose.Types.ObjectId.isValid(machineDB.supportManager)) {
      			machineDB.supportManager = [machineDB.supportManager];
      		}
      	}
      	await machineDB.save();

      	// console.log(machineDB);
      	// console.log(index);

      	index++;
      	// break;
      } else {
		console.log("***MACHINE NOT FOUND***");
	  }
    }
  }
  

  console.log('done')
}

main();
