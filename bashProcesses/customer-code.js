const path = require("path");
const xlsx = require("xlsx");
const { Customer, CustomerSite, CustomerContact } = require('../appsrc/modules/crm/models');
const { Product, ProductModel } = require('../appsrc/modules/products/models');
const { SecurityUser } = require('../appsrc/modules/security/models');
const mongoose = require('../appsrc/modules/db/dbConnection');

const filePath = path.resolve(__dirname, "Customers-Code.xlsx");
// console.log(filePath)
const workbook = xlsx.readFile(filePath);
const sheetNames = workbook.SheetNames;
// console.log(sheetNames)
// Get the data of "Sheet1"
const customers = xlsx.utils.sheet_to_json(workbook.Sheets['in']);

async function main() {


  for(let customer of customers) {

    if(customer.Code) {
      let customer__ = await Customer.findById(customer.ID);
      if(customer__) {
        customer__.clientCode = customer.Code;
        customer__ = await customer__.save();
      }
    }
  }
  

}

main();
