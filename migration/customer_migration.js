const path = require("path");
const xlsx = require("xlsx");
const { Customer, CustomerSite, CustomerContact } = require('../appsrc/modules/crm/models');
const { Product, ProductModel } = require('../appsrc/modules/products/models');
const { SecurityUser } = require('../appsrc/modules/security/models');
const mongoose = require('../appsrc/modules/db/dbConnection');

const filePath = path.resolve(__dirname, "migrationXlsx.xlsx");
// console.log(filePath)
const workbook = xlsx.readFile(filePath);
const sheetNames = workbook.SheetNames;
// console.log(sheetNames)
// Get the data of "Sheet1"
const customers = xlsx.utils.sheet_to_json(workbook.Sheets['Accounts']);
const contacts = xlsx.utils.sheet_to_json(workbook.Sheets['Contacts']);
const users = xlsx.utils.sheet_to_json(workbook.Sheets['Users']);
const machines = xlsx.utils.sheet_to_json(workbook.Sheets['Machines']);

async function main() {

  let createdByUser = await SecurityUser.findOne({login:'naveed@terminustech.co.nz'});

  let howickCustomer = await Customer.findOne({type:"SP"});
  if(howickCustomer) {
    for(let user of users) {

      let howickContact = await CustomerContact.findOne({
        firstName:user.FirstName,
        customer:howickCustomer.id,
        phone:user.Phone,
        email:user.Email
      });
      if(!howickContact) {

        if(!user.FirstName || user.FirstName=='')
          user.FirstName = user.LastName;

        howickContact = {
          firstName:user.FirstName,
          lastName:user.LastName,
          title:user.Title,
          customer:howickCustomer.id,
          phone:user.Phone,
          email:user.Email,
          sites: [],
          contactTypes: [],
          address:{
            street:user.Street,
            suburb:'',
            postcode:user.PostalCode,
            city:user.City,
            region:user.State,
            country:user.Country,
          },
          createdBy:createdByUser.id,
          updatedBy:createdByUser.id,

        }


        howickContact = new CustomerContact(howickContact);
        howickContact = await howickContact.save();
      }
      user.howickContact = howickContact.id;

      let howickUser = await SecurityUser.findOne({
        name:user.name,
        customer:howickCustomer.id,
        phone:user.Phone,
        email:user.Email,
      });
      
      if(!howickUser) {
        howickUser = {
          name:user.name,
          customer:howickCustomer.id,
          contact:howickContact.id,
          phone:user.Phone,
          email:user.Email, 
          login:user.Email, 
          createdBy:createdByUser.id,
          updatedBy:createdByUser.id,
          password:"$2a$12$LiWhhMtWhsnnDzAHvzPecO1Xd/kf/Orf4YRuIOZqRyrlUGgDlvcw22"
        }
        howickUser = await SecurityUser.create(howickUser);
      }
      user._id = howickUser.id;
    }
  }
  // for(let customer of customers) {
  //   console.log(customer.Type)
  //   if(customer.Type=='Customer') {

  //     let customerId = customer.Id;
      
  //     let sheetContacts = contacts.filter((c)=>c.AccountId==customerId);
      
  //     let customer__ = await Customer.findOne({
  //       name : customer.Name,
  //       // tradingName: customer.Name,
  //       type:customer.Type
  //     });

  //     if(!customer__) {
  //       let accountManager = users.find((u)=>u.FullName==customer.OwnerName);
  //       customer__ = {
  //         name : customer.Name,
  //         tradingName: [customer.Name],
  //         type:customer.Type,
  //         contacts:[],
  //         sites:[],
  //         createdBy:createdByUser.id,
  //         updatedBy:createdByUser.id,
  //       }

  //       if(accountManager) {
  //         customer__.accountManager = accountManager.howickContact;
  //         customer__.createdBy = accountManager._id;
  //         customer__.updatedBy = accountManager._id;
  //       }

  //       customer__ = await Customer.create(customer__);      
  //     }


  //     let billingSite = await CustomerSite.findOne({
  //       name:customer.Name,
  //       customer:customer__.id,
  //     })
  //     if(!billingSite) {

  //       billingSite = {
  //         name:customer.Name,
  //         phone:customer.Phone,
  //         email:'',
  //         fax:customer.Fax,
  //         website:customer.Website,
  //         lat:customer.Geolocation__Latitude__s,
  //         long:customer.Geolocation__Longitude__s,
  //         customer:customer__.id,
  //         contacts:[],
  //         address:{
  //           street:customer.BillingStreet,
  //           suburb:'',
  //           postcode:customer.BillingPostalCode,
  //           city:customer.BillingCity,
  //           region:customer.BillingState,
  //           country:customer.BillingCountry,
  //         },
  //         createdBy:createdByUser.id,
  //         updatedBy:createdByUser.id,
  //       }

  //       billingSite = await CustomerSite.create(billingSite);
  //       customer__.sites.push(billingSite.id);
  //       customer__.mainSite = billingSite.id;

  //     }



  //     if(customer.Use_Billing_Address_as_Shipping__c==0) {

  //       let shippingSite = await CustomerSite.findOne({
  //         name:customer.Name,
  //         customer:customer__.id,
  //       });

  //       if(!shippingSite) {

  //         shippingSite = {
  //           name:customer.Name,
  //           phone:customer.Phone,
  //           email:'',
  //           customer:customer__.id,
  //           fax:customer.Fax,
  //           website:customer.Website,
  //           lat:customer.Geolocation__Latitude__s,
  //           long:customer.Geolocation__Longitude__s,
  //           contacts:[],
  //           address:{
  //             street:customer.ShippingStreet,
  //             suburb:'',
  //             postcode:customer.ShippingPostalCode,
  //             city:customer.ShippingCity,
  //             region:customer.ShippingState,
  //             country:customer.ShippingCountry,
  //           },
  //           createdBy:createdByUser.id,
  //           updatedBy:createdByUser.id,
  //         }

  //         shippingSite = await CustomerSite.create(shippingSite);
  //         customer__.sites.push(shippingSite.id);

  //       }
        
  //     }
      
  //     for(let sheetContact of sheetContacts) {

  //       let createdBy = users.find((u)=>u.Id==sheetContact.CreatedById);
        
  //       let contact = await CustomerContact.findOne({
  //         firstName:sheetContact.FirstName,
  //         customer:customer__.id,
  //       });
  //       if(!contact) {
  //         contact = {
  //           firstName:sheetContact.FirstName,
  //           lastName:sheetContact.LastName,
  //           title:sheetContact.Title,
  //           phone:sheetContact.Phone,
  //           customer:customer__.id,
  //           email:sheetContact.Email,
  //           createdBy:createdBy._id,
  //           updatedBy:createdBy._id,
  //           sites: [],
  //           contactTypes: [],
  //           address:{
  //             street:sheetContact.MailingStreet,
  //             suburb:'',
  //             postcode:sheetContact.MailingPostalCode,
  //             city:sheetContact.MailingCity,
  //             region:sheetContact.MailingState,
  //             country:sheetContact.MailingCountry,
  //           }
  //         };

  //         contact = await CustomerContact.create(contact);
  //       }

  //       if(contact.id) 
  //         customer__.contacts.push(contact.id);
        
  //       sheetContact._id = contact.id;
  //     }

  //     customer__ = await customer__.save();

  //     console.log(customer__);

  //     // let customerMachines = machines.filter((c)=>c.Account__c==customerId);
  //     // for(let machine of customerMachines) {

  //     //   let machine_ = await Product.findOne({
  //     //     serialNo:machine.SerialNumber,
  //     //   })
  //     //   if(!machine_) {
  //     //     let createdBy = users.find((u)=>u.Id==machine.CreatedById);

  //     //     let machineSite = await CustomerSite.findOne({
  //     //       name:machine.AccountName,
  //     //       customer:customer__.id,
  //     //     });

  //     //     if(!machineSite) {

  //     //       machineSite = {
  //     //         name:machine.AccountName,
  //     //         phone:'',
  //     //         email:'',
  //     //         customer:customer__.id,
  //     //         contacts:[],
  //     //         address:{
  //     //           street:customer.Street__c,
  //     //           suburb:'',
  //     //           postcode:customer.PostalCode__c,
  //     //           city:machine.City__c,
  //     //           region:customer.State__c,
  //     //           country:machine.Country,
  //     //         },
  //     //         createdBy:createdByUser.id,
  //     //         updatedBy:createdByUser.id,
  //     //       }

  //     //       machineSite = await CustomerSite.create(machineSite);
  //     //     }
          

  //     //     let contact = contacts.find((c)=>c.Id==machine.Machine_Service_Contact__c);

  //     //     machine_ = {
  //     //       name:machine.Machine_Name__c,
  //     //       serialNo:machine.SerialNumber,
  //     //       customer:customer__.id,
  //     //       createdBy:createdBy._id,
  //     //       updatedBy:createdBy._id,
  //     //       operators:[createdBy.howickContact],
  //     //       accountManager:createdBy.howickContact,
  //     //       billingSite:customer__.mainSite,
  //     //       status:'642607ab7ce0781e19dc2b22',
  //     //       instalationSite: machineSite.id,
  //     //       // billingSite: machineSite.id,
  //     //     }

  //     //     let query = { "name" : { $regex: machine.Machine_Name__c, $options: 'i' }};
  //     //     let machineModel = await ProductModel.findOne(query);

  //     //     if(machineModel) {
  //     //       machine_.machineModel = machineModel.id;
  //     //     }
  //     //     if(contact) {
  //     //       machine_.operators.push(contact._id);
  //     //       machine_.supportManager = contact._id;
  //     //     }

  //     //     // console.log(machine.ParentSerialNumber)
  //     //     // process.exit();
  //     //     if(machine.ParentSerialNumber) {
  //     //       machine_.parentSerialNo = machine.ParentSerialNumber;
  //     //     }

  //     //     machine_ = new Product(machine_);
  //     //     await machine_.save();


  //     //   }
  //     // }

  //     // let dbMachines = await Product.find({parentSerialNo:{$ne:null}});

  //     // for(let dbMachine of dbMachines) {

  //     //   if(dbMachine.parentSerialNo && dbMachine.parentSerialNo!='' && !dbMachine.parentMachine && 
  //     //     dbMachine.parentSerialNo.length==5) {
  //     //     let parentMachine = await Product.findOne({serialNo:dbMachine.parentSerialNo});
  //     //     if(parentMachine) {
  //     //       dbMachine.parentMachine = parentMachine.id;    
  //     //       await dbMachine.save();
  //     //     }
  //     //   }
  //     // }
  //     // process.exit();
  //   }

  // }

  console.log('done')
}

main();
