const { Customer, CustomerSite, CustomerContact, CustomerNote } = require('../../crm/models');
const { securityUser } = require('../../security/models');

let dbCustomerService = require('../../crm/service/customerDBService')
this.dbservice = new dbCustomerService();


this.fields = {};
this.query = {};
this.orderBy = { createdAt: -1 };
this.populate = [
  'mainSite',
  'primaryBillingContact',
  'primaryTechnicalContact',
  'createdBy',
  'updatedBy',
];

var aggregate = [
  {
    $lookup: {
      from: "Customers",
      localField: "customer",
      foreignField: "_id",
      as: "customer"
    }
  },
    {
    $match: {
      "customer.type" : "SP"
    }
  }
];


const axios = require('axios');
const environment = require('./environment');
const env = new environment();
const moduleName = '/crm/customers/';
const URL = env.getHost_Url() + moduleName;
const headers = env.getHeaders();

const { customerMaxObject } = require('./customersJSON');

describe('Customer API', () => {
  it('should create a new customer', async () => {
    try {
      this.spContacts = await this.dbservice.getObjectListWithAggregate(CustomerContact, aggregate, null);
      this.spContact = this.spContacts.length > 0 ? this.spContacts[0]._id : null;
      
      if(this.spContact) {
        customerMaxObject.accountManager = this.spContact.toString();
        customerMaxObject.projectManager = this.spContact.toString();
        customerMaxObject.supportManager = this.spContact.toString();
      } else {
        delete customerMaxObject.accountManager;
        delete customerMaxObject.projectManager;
        delete customerMaxObject.supportManager;  
      }

      const response = await axios.post(URL, customerMaxObject, { headers });
      const customer = response.data.Customer._id;


      let dbCustomer = await this.dbservice.getObjectById(Customer, this.fields, customer, this.populate);
      expect(dbCustomer.name).toEqual(customerMaxObject.name);
      expect(dbCustomer.tradingName).toEqual(customerMaxObject.tradingName);
      expect(dbCustomer.type).toEqual("customer");
      expect(dbCustomer.mainSite.name).toEqual(customerMaxObject.mainSite.name);
      expect(dbCustomer.mainSite.phone).toEqual(customerMaxObject.mainSite.phone);
      expect(dbCustomer.mainSite.email).toEqual(customerMaxObject.mainSite.email);
      expect(dbCustomer.mainSite.fax).toEqual(customerMaxObject.mainSite.fax);
      expect(dbCustomer.mainSite.website).toEqual(customerMaxObject.mainSite.website);
      expect(dbCustomer.mainSite.address.street).toEqual(customerMaxObject.mainSite.address.street);
      expect(dbCustomer.mainSite.address.suburb).toEqual(customerMaxObject.mainSite.address.suburb);
      expect(dbCustomer.mainSite.address.city).toEqual(customerMaxObject.mainSite.address.city);
      expect(dbCustomer.mainSite.address.region).toEqual(customerMaxObject.mainSite.address.region);
      expect(dbCustomer.mainSite.address.postcode).toEqual(customerMaxObject.mainSite.address.postcode);
      expect(dbCustomer.mainSite.address.country).toEqual(customerMaxObject.mainSite.address.country);
      expect(dbCustomer.mainSite.address.latitude).toEqual(customerMaxObject.mainSite.address.latitude);
      expect(dbCustomer.mainSite.address.longitude).toEqual(customerMaxObject.mainSite.address.longitude);
      expect(dbCustomer.primaryBillingContact.firstName).toEqual(customerMaxObject.billingContact.firstName);
      expect(dbCustomer.primaryBillingContact.lastName).toEqual(customerMaxObject.billingContact.lastName);
      expect(dbCustomer.primaryBillingContact.title).toEqual(customerMaxObject.billingContact.title);
      expect(dbCustomer.primaryBillingContact.contactTypes).toEqual(expect.arrayContaining(customerMaxObject.billingContact.contactTypes));
      expect(dbCustomer.primaryBillingContact.phone).toEqual(customerMaxObject.billingContact.phone);
      expect(dbCustomer.primaryBillingContact.email).toEqual(customerMaxObject.billingContact.email);
      expect(dbCustomer.primaryTechnicalContact.firstName).toEqual(customerMaxObject.technicalContact.firstName);
      expect(dbCustomer.primaryTechnicalContact.lastName).toEqual(customerMaxObject.technicalContact.lastName);
      expect(dbCustomer.primaryTechnicalContact.title).toEqual(customerMaxObject.technicalContact.title);
      expect(dbCustomer.primaryTechnicalContact.contactTypes).toEqual(expect.arrayContaining(customerMaxObject.technicalContact.contactTypes));
      expect(dbCustomer.primaryTechnicalContact.phone).toEqual(customerMaxObject.technicalContact.phone);
      expect(dbCustomer.primaryTechnicalContact.email).toEqual(customerMaxObject.technicalContact.email);

      if(this.spContact) {
        expect(dbCustomer.accountManager).toEqual(this.spContact);
        expect(dbCustomer.projectManager).toEqual(this.spContact);
        expect(dbCustomer.supportManager).toEqual(this.spContact);  
      }

    } catch (error) {
      console.error('Error:', error);
    }
  });
});
