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
const moduleName = '/crm/customers';
const customerId = "646ef6eabea00b354cdcc655y";
const URL = env.getHost_Url() + moduleName;
// const URL_update = env.getHost_Url() + moduleName + ID;
const URL_update = `${env.getHost_Url()}${moduleName}/${customerId}`;
console.log(URL_update, "@1")
// const URL_Update = `${env.getHost_Url()}${moduleName}/${Id}`;
const headers = env.getHeaders();


const { customerMaxObject, customerMinObject, customerReqObject, InvalidData, updateObject } = require('./customersJSON');
//  Customer Add Form Functionality Test with Maximum Values.
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
  },10000);
},10000);
// Customer Add Form Functionality Test with Minimum Values.
describe('Customer API', () => {
  it('should create a new customer with Minimum values', async () => {
    try {
      this.spContacts = await this.dbservice.getObjectListWithAggregate(CustomerContact, aggregate, null);
      this.spContact = this.spContacts.length > 0 ? this.spContacts[0]._id : null;
      if(this.spContact) {
        customerMinObject.accountManager = this.spContact.toString();
        customerMinObject.projectManager = this.spContact.toString();
        customerMinObject.supportManager = this.spContact.toString();
      } else {
        delete customerMinObject.accountManager;
        delete customerMinObject.projectManager;
        delete customerMinObject.supportManager;  
      }

      const response = await axios.post(URL, customerMinObject, { headers });
      const customer = response.data.Customer._id;


      let dbCustomer = await this.dbservice.getObjectById(Customer, this.fields, customer, this.populate);
      expect(dbCustomer.name).toEqual(customerMinObject.name);
      expect(dbCustomer.tradingName).toEqual(customerMinObject.tradingName);
      expect(dbCustomer.type).toEqual("customer");
      expect(dbCustomer.mainSite.name).toEqual(customerMinObject.mainSite.name);
      expect(dbCustomer.mainSite.phone).toEqual(customerMinObject.mainSite.phone);
      expect(dbCustomer.mainSite.email).toEqual(customerMinObject.mainSite.email);
      expect(dbCustomer.mainSite.fax).toEqual(customerMinObject.mainSite.fax);
      expect(dbCustomer.mainSite.website).toEqual(customerMinObject.mainSite.website);
      expect(dbCustomer.mainSite.address.street).toEqual(customerMinObject.mainSite.address.street);
      expect(dbCustomer.mainSite.address.suburb).toEqual(customerMinObject.mainSite.address.suburb);
      expect(dbCustomer.mainSite.address.city).toEqual(customerMinObject.mainSite.address.city);
      expect(dbCustomer.mainSite.address.region).toEqual(customerMinObject.mainSite.address.region);
      expect(dbCustomer.mainSite.address.postcode).toEqual(customerMinObject.mainSite.address.postcode);
      expect(dbCustomer.mainSite.address.country).toEqual(customerMinObject.mainSite.address.country);
      expect(dbCustomer.mainSite.address.latitude).toEqual(customerMinObject.mainSite.address.latitude);
      expect(dbCustomer.mainSite.address.longitude).toEqual(customerMinObject.mainSite.address.longitude);
      expect(dbCustomer.primaryBillingContact.firstName).toEqual(customerMinObject.billingContact.firstName);
      expect(dbCustomer.primaryBillingContact.lastName).toEqual(customerMinObject.billingContact.lastName);
      expect(dbCustomer.primaryBillingContact.title).toEqual(customerMinObject.billingContact.title);
      expect(dbCustomer.primaryBillingContact.contactTypes).toEqual(expect.arrayContaining(customerMinObject.billingContact.contactTypes));
      expect(dbCustomer.primaryBillingContact.phone).toEqual(customerMinObject.billingContact.phone);
      expect(dbCustomer.primaryBillingContact.email).toEqual(customerMinObject.billingContact.email);
      expect(dbCustomer.primaryTechnicalContact.firstName).toEqual(customerMinObject.technicalContact.firstName);
      expect(dbCustomer.primaryTechnicalContact.lastName).toEqual(customerMinObject.technicalContact.lastName);
      expect(dbCustomer.primaryTechnicalContact.title).toEqual(customerMinObject.technicalContact.title);
      expect(dbCustomer.primaryTechnicalContact.contactTypes).toEqual(expect.arrayContaining(customerMinObject.technicalContact.contactTypes));
      expect(dbCustomer.primaryTechnicalContact.phone).toEqual(customerMinObject.technicalContact.phone);
      expect(dbCustomer.primaryTechnicalContact.email).toEqual(customerMinObject.technicalContact.email);

      if(this.spContact) {
        expect(dbCustomer.accountManager).toEqual(this.spContact);
        expect(dbCustomer.projectManager).toEqual(this.spContact);
        expect(dbCustomer.supportManager).toEqual(this.spContact);  
      }

    } catch (error) {
      console.error('Error:', error);
    }
  },10000);
},10000);
// Customer Add Form Functionality Test with Required Value.
describe('Customer API', () => {
  it('should create a new customer with Required values', async () => {
    try {
      this.spContacts = await this.dbservice.getObjectListWithAggregate(CustomerContact, aggregate, null);
      this.spContact = this.spContacts.length > 0 ? this.spContacts[0]._id : null;
      if(this.spContact) {
        customerReqObject.accountManager = this.spContact.toString();
        customerReqObject.projectManager = this.spContact.toString();
        customerReqObject.supportManager = this.spContact.toString();
      } else {
        delete customerReqObject.accountManager;
        delete customerReqObject.projectManager;
        delete customerReqObject.supportManager;  
      }

      const response = await axios.post(URL, customerReqObject, { headers });
      const customer = response.data.Customer._id;


      let dbCustomer = await this.dbservice.getObjectById(Customer, this.fields, customer, this.populate);
      expect(dbCustomer.name).toEqual(customerReqObject.name);
      expect(dbCustomer.tradingName).toEqual(customerReqObject.tradingName);
      expect(dbCustomer.type).toEqual("customer");
      expect(dbCustomer.mainSite.name).toEqual(customerReqObject.mainSite.name);
      expect(dbCustomer.mainSite.phone).toEqual(customerReqObject.mainSite.phone);
      expect(dbCustomer.mainSite.email).toEqual(customerReqObject.mainSite.email);
      expect(dbCustomer.mainSite.fax).toEqual(customerReqObject.mainSite.fax);
      expect(dbCustomer.mainSite.website).toEqual(customerReqObject.mainSite.website);
      expect(dbCustomer.mainSite.address.street).toEqual(customerReqObject.mainSite.address.street);
      expect(dbCustomer.mainSite.address.suburb).toEqual(customerReqObject.mainSite.address.suburb);
      expect(dbCustomer.mainSite.address.city).toEqual(customerReqObject.mainSite.address.city);
      expect(dbCustomer.mainSite.address.region).toEqual(customerReqObject.mainSite.address.region);
      expect(dbCustomer.mainSite.address.postcode).toEqual(customerReqObject.mainSite.address.postcode);
      expect(dbCustomer.mainSite.address.country).toEqual(customerReqObject.mainSite.address.country);
      expect(dbCustomer.mainSite.address.latitude).toEqual(customerReqObject.mainSite.address.latitude);
      expect(dbCustomer.mainSite.address.longitude).toEqual(customerReqObject.mainSite.address.longitude);
      expect(dbCustomer.primaryBillingContact.firstName).toEqual(customerReqObject.billingContact.firstName);
      expect(dbCustomer.primaryBillingContact.lastName).toEqual(customerReqObject.billingContact.lastName);
      expect(dbCustomer.primaryBillingContact.title).toEqual(customerReqObject.billingContact.title);
      expect(dbCustomer.primaryBillingContact.contactTypes).toEqual(expect.arrayContaining(customerReqObject.billingContact.contactTypes));
      expect(dbCustomer.primaryBillingContact.phone).toEqual(customerReqObject.billingContact.phone);
      expect(dbCustomer.primaryBillingContact.email).toEqual(customerReqObject.billingContact.email);
      expect(dbCustomer.primaryTechnicalContact.firstName).toEqual(customerReqObject.technicalContact.firstName);
      expect(dbCustomer.primaryTechnicalContact.lastName).toEqual(customerReqObject.technicalContact.lastName);
      expect(dbCustomer.primaryTechnicalContact.title).toEqual(customerReqObject.technicalContact.title);
      expect(dbCustomer.primaryTechnicalContact.contactTypes).toEqual(expect.arrayContaining(customerReqObject.technicalContact.contactTypes));
      expect(dbCustomer.primaryTechnicalContact.phone).toEqual(customerReqObject.technicalContact.phone);
      expect(dbCustomer.primaryTechnicalContact.email).toEqual(customerReqObject.technicalContact.email);

      if(this.spContact) {
        expect(dbCustomer.accountManager).toEqual(this.spContact);
        expect(dbCustomer.projectManager).toEqual(this.spContact);
        expect(dbCustomer.supportManager).toEqual(this.spContact);  
      }

    } catch (error) {
      console.error('Error:', error);
    }
  },10000);
},10000);
// Customer Add Form Functionality Test with Invalid Data.
describe('Customer API', () => {
  it('should not create a new customer with Invalid Data', async () => {
    try {
      this.spContacts = await this.dbservice.getObjectListWithAggregate(CustomerContact, aggregate, null);
      this.spContact = this.spContacts.length > 0 ? this.spContacts[0]._id : null;
      if(this.spContact) {
        InvalidData.accountManager = this.spContact.toString();
        InvalidData.projectManager = this.spContact.toString();
        InvalidData.supportManager = this.spContact.toString();
      } else {
        delete InvalidData.accountManager;
        delete InvalidData.projectManager;
        delete InvalidData.supportManager;  
      }

      const response = await axios.post(URL, InvalidData, { headers });
      const customer = response.data.Customer._id;


      let dbCustomer = await this.dbservice.getObjectById(Customer, this.fields, customer, this.populate);
      expect(dbCustomer.name).toEqual(InvalidData.name);
      expect(dbCustomer.tradingName).toEqual(InvalidData.tradingName);
      expect(dbCustomer.type).toEqual("customer");
      expect(dbCustomer.mainSite.name).toEqual(InvalidData.mainSite.name);
      expect(dbCustomer.mainSite.phone).toEqual(InvalidData.mainSite.phone);
      expect(dbCustomer.mainSite.email).toEqual(InvalidData.mainSite.email);
      expect(dbCustomer.mainSite.fax).toEqual(InvalidData.mainSite.fax);
      expect(dbCustomer.mainSite.website).toEqual(InvalidData.mainSite.website);
      expect(dbCustomer.mainSite.address.street).toEqual(InvalidData.mainSite.address.street);
      expect(dbCustomer.mainSite.address.suburb).toEqual(InvalidData.mainSite.address.suburb);
      expect(dbCustomer.mainSite.address.city).toEqual(InvalidData.mainSite.address.city);
      expect(dbCustomer.mainSite.address.region).toEqual(InvalidData.mainSite.address.region);
      expect(dbCustomer.mainSite.address.postcode).toEqual(InvalidData.mainSite.address.postcode);
      expect(dbCustomer.mainSite.address.country).toEqual(InvalidData.mainSite.address.country);
      expect(dbCustomer.mainSite.address.latitude).toEqual(InvalidData.mainSite.address.latitude);
      expect(dbCustomer.mainSite.address.longitude).toEqual(InvalidData.mainSite.address.longitude);
      expect(dbCustomer.primaryBillingContact.firstName).toEqual(InvalidData.billingContact.firstName);
      expect(dbCustomer.primaryBillingContact.lastName).toEqual(InvalidData.billingContact.lastName);
      expect(dbCustomer.primaryBillingContact.title).toEqual(InvalidData.billingContact.title);
      expect(dbCustomer.primaryBillingContact.contactTypes).toEqual(expect.arrayContaining(InvalidData.billingContact.contactTypes));
      expect(dbCustomer.primaryBillingContact.phone).toEqual(InvalidData.billingContact.phone);
      expect(dbCustomer.primaryBillingContact.email).toEqual(InvalidData.billingContact.email);
      expect(dbCustomer.primaryTechnicalContact.firstName).toEqual(InvalidData.technicalContact.firstName);
      expect(dbCustomer.primaryTechnicalContact.lastName).toEqual(InvalidData.technicalContact.lastName);
      expect(dbCustomer.primaryTechnicalContact.title).toEqual(InvalidData.technicalContact.title);
      expect(dbCustomer.primaryTechnicalContact.contactTypes).toEqual(expect.arrayContaining(InvalidData.technicalContact.contactTypes));
      expect(dbCustomer.primaryTechnicalContact.phone).toEqual(InvalidData.technicalContact.phone);
      expect(dbCustomer.primaryTechnicalContact.email).toEqual(InvalidData.technicalContact.email);

      if(this.spContact) {
        expect(dbCustomer.accountManager).toEqual(this.spContact);
        expect(dbCustomer.projectManager).toEqual(this.spContact);
        expect(dbCustomer.supportManager).toEqual(this.spContact);  
      }

    } catch (error) {
      console.error('Error:', error);
    }
  },10000);
},10000);
//updating a customer
describe('Customer API', () => {
  it('should update a customer', async () => {
    try {


      this.spContacts = await this.dbservice.getObjectListWithAggregate(CustomerContact, aggregate, null);
      this.spContact = this.spContacts.length > 0 ? this.spContacts[0]._id : null;
      if(this.spContact) {
        updateObject.accountManager = this.spContact.toString();
        updateObject.projectManager = this.spContact.toString();
        updateObject.supportManager = this.spContact.toString();
      } else {
        delete updateObject.accountManager;
        delete updateObject.projectManager;
        delete updateObject.supportManager;  
      }

      const response = await axios.patch(URL_update, updateObject, { headers });
      const customer = response.data.Customer._id;
      // console.log(customer, '@1')

      let dbCustomer = await this.dbservice.getObjectById(Customer, this.fields, customer, this.populate);
      expect(dbCustomer.name).toEqual(updateObject.name);
      expect(dbCustomer.tradingName).toEqual(updateObject.tradingName);
      expect(dbCustomer.type).toEqual("customer");
      expect(dbCustomer.mainSite.name).toEqual(updateObject.mainSite.name);
      expect(dbCustomer.mainSite.phone).toEqual(updateObject.mainSite.phone);
      expect(dbCustomer.mainSite.email).toEqual(updateObject.mainSite.email);
      expect(dbCustomer.mainSite.fax).toEqual(updateObject.mainSite.fax);
      expect(dbCustomer.mainSite.website).toEqual(updateObject.mainSite.website);
      expect(dbCustomer.mainSite.address.street).toEqual(updateObject.mainSite.address.street);
      expect(dbCustomer.mainSite.address.suburb).toEqual(updateObject.mainSite.address.suburb);
      expect(dbCustomer.mainSite.address.city).toEqual(updateObject.mainSite.address.city);
      expect(dbCustomer.mainSite.address.region).toEqual(updateObject.mainSite.address.region);
      expect(dbCustomer.mainSite.address.postcode).toEqual(updateObject.mainSite.address.postcode);
      expect(dbCustomer.mainSite.address.country).toEqual(updateObject.mainSite.address.country);
      expect(dbCustomer.mainSite.address.latitude).toEqual(updateObject.mainSite.address.latitude);
      expect(dbCustomer.mainSite.address.longitude).toEqual(updateObject.mainSite.address.longitude);
      expect(dbCustomer.primaryBillingContact.firstName).toEqual(updateObject.billingContact.firstName);
      expect(dbCustomer.primaryBillingContact.lastName).toEqual(updateObject.billingContact.lastName);
      expect(dbCustomer.primaryBillingContact.title).toEqual(updateObject.billingContact.title);
      expect(dbCustomer.primaryBillingContact.contactTypes).toEqual(expect.arrayContaining(updateObject.billingContact.contactTypes));
      expect(dbCustomer.primaryBillingContact.phone).toEqual(updateObject.billingContact.phone);
      expect(dbCustomer.primaryBillingContact.email).toEqual(updateObject.billingContact.email);
      expect(dbCustomer.primaryTechnicalContact.firstName).toEqual(updateObject.technicalContact.firstName);
      expect(dbCustomer.primaryTechnicalContact.lastName).toEqual(updateObject.technicalContact.lastName);
      expect(dbCustomer.primaryTechnicalContact.title).toEqual(updateObject.technicalContact.title);
      expect(dbCustomer.primaryTechnicalContact.contactTypes).toEqual(expect.arrayContaining(updateObject.technicalContact.contactTypes));
      expect(dbCustomer.primaryTechnicalContact.phone).toEqual(updateObject.technicalContact.phone);
      expect(dbCustomer.primaryTechnicalContact.email).toEqual(updateObject.technicalContact.email);

      if(this.spContact) {
        expect(dbCustomer.accountManager).toEqual(this.spContact);
        expect(dbCustomer.projectManager).toEqual(this.spContact);
        expect(dbCustomer.supportManager).toEqual(this.spContact);  
      }

    } catch (error) {
      console.error('Error:', error);
    }
  },10000);
},10000);

//updating a customer wid minimum value
describe('Customer API', () => {
  it('should update a customer', async () => {
    try {


      this.spContacts = await this.dbservice.getObjectListWithAggregate(CustomerContact, aggregate, null);
      this.spContact = this.spContacts.length > 0 ? this.spContacts[0]._id : null;
      if(this.spContact) {
        updateObject.accountManager = this.spContact.toString();
        updateObject.projectManager = this.spContact.toString();
        updateObject.supportManager = this.spContact.toString();
      } else {
        delete updateObject.accountManager;
        delete updateObject.projectManager;
        delete updateObject.supportManager;  
      }

      const response = await axios.patch(URL_update, updateObject, { headers });
      const customer = response.data.Customer._id;
      // console.log(customer, '@1')

      let dbCustomer = await this.dbservice.getObjectById(Customer, this.fields, customer, this.populate);
      expect(dbCustomer.name).toEqual(updateObject.name);
      expect(dbCustomer.tradingName).toEqual(updateObject.tradingName);
      expect(dbCustomer.type).toEqual("customer");
      expect(dbCustomer.mainSite.name).toEqual(updateObject.mainSite.name);
      expect(dbCustomer.mainSite.phone).toEqual(updateObject.mainSite.phone);
      expect(dbCustomer.mainSite.email).toEqual(updateObject.mainSite.email);
      expect(dbCustomer.mainSite.fax).toEqual(updateObject.mainSite.fax);
      expect(dbCustomer.mainSite.website).toEqual(updateObject.mainSite.website);
      expect(dbCustomer.mainSite.address.street).toEqual(updateObject.mainSite.address.street);
      expect(dbCustomer.mainSite.address.suburb).toEqual(updateObject.mainSite.address.suburb);
      expect(dbCustomer.mainSite.address.city).toEqual(updateObject.mainSite.address.city);
      expect(dbCustomer.mainSite.address.region).toEqual(updateObject.mainSite.address.region);
      expect(dbCustomer.mainSite.address.postcode).toEqual(updateObject.mainSite.address.postcode);
      expect(dbCustomer.mainSite.address.country).toEqual(updateObject.mainSite.address.country);
      expect(dbCustomer.mainSite.address.latitude).toEqual(updateObject.mainSite.address.latitude);
      expect(dbCustomer.mainSite.address.longitude).toEqual(updateObject.mainSite.address.longitude);
      expect(dbCustomer.primaryBillingContact.firstName).toEqual(updateObject.billingContact.firstName);
      expect(dbCustomer.primaryBillingContact.lastName).toEqual(updateObject.billingContact.lastName);
      expect(dbCustomer.primaryBillingContact.title).toEqual(updateObject.billingContact.title);
      expect(dbCustomer.primaryBillingContact.contactTypes).toEqual(expect.arrayContaining(updateObject.billingContact.contactTypes));
      expect(dbCustomer.primaryBillingContact.phone).toEqual(updateObject.billingContact.phone);
      expect(dbCustomer.primaryBillingContact.email).toEqual(updateObject.billingContact.email);
      expect(dbCustomer.primaryTechnicalContact.firstName).toEqual(updateObject.technicalContact.firstName);
      expect(dbCustomer.primaryTechnicalContact.lastName).toEqual(updateObject.technicalContact.lastName);
      expect(dbCustomer.primaryTechnicalContact.title).toEqual(updateObject.technicalContact.title);
      expect(dbCustomer.primaryTechnicalContact.contactTypes).toEqual(expect.arrayContaining(updateObject.technicalContact.contactTypes));
      expect(dbCustomer.primaryTechnicalContact.phone).toEqual(updateObject.technicalContact.phone);
      expect(dbCustomer.primaryTechnicalContact.email).toEqual(updateObject.technicalContact.email);

      if(this.spContact) {
        expect(dbCustomer.accountManager).toEqual(this.spContact);
        expect(dbCustomer.projectManager).toEqual(this.spContact);
        expect(dbCustomer.supportManager).toEqual(this.spContact);  
      }

    } catch (error) {
      console.error('Error:', error);
    }
  },10000);
},10000);

//updating a customer with maximum value

describe('Customer API', () => {
  it('should update a customer with minimum values', async () => {
    try {


      this.spContacts = await this.dbservice.getObjectListWithAggregate(CustomerContact, aggregate, null);
      this.spContact = this.spContacts.length > 0 ? this.spContacts[0]._id : null;
      if(this.spContact) {
        updateObject.accountManager = this.spContact.toString();
        updateObject.projectManager = this.spContact.toString();
        updateObject.supportManager = this.spContact.toString();
      } else {
        delete updateObject.accountManager;
        delete updateObject.projectManager;
        delete updateObject.supportManager;  
      }

      const response = await axios.patch(URL_update, updateObject, { headers });
      const customer = response.data.Customer._id;
      // console.log(customer, '@1')

      let dbCustomer = await this.dbservice.getObjectById(Customer, this.fields, customer, this.populate);
      expect(dbCustomer.name).toEqual(updateObject.name);
      expect(dbCustomer.tradingName).toEqual(updateObject.tradingName);
      expect(dbCustomer.type).toEqual("customer");
      expect(dbCustomer.mainSite.name).toEqual(updateObject.mainSite.name);
      expect(dbCustomer.mainSite.phone).toEqual(updateObject.mainSite.phone);
      expect(dbCustomer.mainSite.email).toEqual(updateObject.mainSite.email);
      expect(dbCustomer.mainSite.fax).toEqual(updateObject.mainSite.fax);
      expect(dbCustomer.mainSite.website).toEqual(updateObject.mainSite.website);
      expect(dbCustomer.mainSite.address.street).toEqual(updateObject.mainSite.address.street);
      expect(dbCustomer.mainSite.address.suburb).toEqual(updateObject.mainSite.address.suburb);
      expect(dbCustomer.mainSite.address.city).toEqual(updateObject.mainSite.address.city);
      expect(dbCustomer.mainSite.address.region).toEqual(updateObject.mainSite.address.region);
      expect(dbCustomer.mainSite.address.postcode).toEqual(updateObject.mainSite.address.postcode);
      expect(dbCustomer.mainSite.address.country).toEqual(updateObject.mainSite.address.country);
      expect(dbCustomer.mainSite.address.latitude).toEqual(updateObject.mainSite.address.latitude);
      expect(dbCustomer.mainSite.address.longitude).toEqual(updateObject.mainSite.address.longitude);
      expect(dbCustomer.primaryBillingContact.firstName).toEqual(updateObject.billingContact.firstName);
      expect(dbCustomer.primaryBillingContact.lastName).toEqual(updateObject.billingContact.lastName);
      expect(dbCustomer.primaryBillingContact.title).toEqual(updateObject.billingContact.title);
      expect(dbCustomer.primaryBillingContact.contactTypes).toEqual(expect.arrayContaining(updateObject.billingContact.contactTypes));
      expect(dbCustomer.primaryBillingContact.phone).toEqual(updateObject.billingContact.phone);
      expect(dbCustomer.primaryBillingContact.email).toEqual(updateObject.billingContact.email);
      expect(dbCustomer.primaryTechnicalContact.firstName).toEqual(updateObject.technicalContact.firstName);
      expect(dbCustomer.primaryTechnicalContact.lastName).toEqual(updateObject.technicalContact.lastName);
      expect(dbCustomer.primaryTechnicalContact.title).toEqual(updateObject.technicalContact.title);
      expect(dbCustomer.primaryTechnicalContact.contactTypes).toEqual(expect.arrayContaining(updateObject.technicalContact.contactTypes));
      expect(dbCustomer.primaryTechnicalContact.phone).toEqual(updateObject.technicalContact.phone);
      expect(dbCustomer.primaryTechnicalContact.email).toEqual(updateObject.technicalContact.email);

      if(this.spContact) {
        expect(dbCustomer.accountManager).toEqual(this.spContact);
        expect(dbCustomer.projectManager).toEqual(this.spContact);
        expect(dbCustomer.supportManager).toEqual(this.spContact);  
      }

    } catch (error) {
      console.error('Error:', error);
    }
  },10000);
},10000);

//updating a customer with required value

describe('Customer API', () => {
  it('should update a customer with required value', async () => {
    try {


      this.spContacts = await this.dbservice.getObjectListWithAggregate(CustomerContact, aggregate, null);
      this.spContact = this.spContacts.length > 0 ? this.spContacts[0]._id : null;
      if(this.spContact) {
        updateObject.accountManager = this.spContact.toString();
        updateObject.projectManager = this.spContact.toString();
        updateObject.supportManager = this.spContact.toString();
      } else {
        delete updateObject.accountManager;
        delete updateObject.projectManager;
        delete updateObject.supportManager;  
      }

      const response = await axios.patch(URL_update, updateObject, { headers });
      const customer = response.data.Customer._id;
      // console.log(customer, '@1')

      let dbCustomer = await this.dbservice.getObjectById(Customer, this.fields, customer, this.populate);
      expect(dbCustomer.name).toEqual(updateObject.name);
      expect(dbCustomer.tradingName).toEqual(updateObject.tradingName);
      expect(dbCustomer.type).toEqual("customer");
      expect(dbCustomer.mainSite.name).toEqual(updateObject.mainSite.name);
      expect(dbCustomer.mainSite.phone).toEqual(updateObject.mainSite.phone);
      expect(dbCustomer.mainSite.email).toEqual(updateObject.mainSite.email);
      expect(dbCustomer.mainSite.fax).toEqual(updateObject.mainSite.fax);
      expect(dbCustomer.mainSite.website).toEqual(updateObject.mainSite.website);
      expect(dbCustomer.mainSite.address.street).toEqual(updateObject.mainSite.address.street);
      expect(dbCustomer.mainSite.address.suburb).toEqual(updateObject.mainSite.address.suburb);
      expect(dbCustomer.mainSite.address.city).toEqual(updateObject.mainSite.address.city);
      expect(dbCustomer.mainSite.address.region).toEqual(updateObject.mainSite.address.region);
      expect(dbCustomer.mainSite.address.postcode).toEqual(updateObject.mainSite.address.postcode);
      expect(dbCustomer.mainSite.address.country).toEqual(updateObject.mainSite.address.country);
      expect(dbCustomer.mainSite.address.latitude).toEqual(updateObject.mainSite.address.latitude);
      expect(dbCustomer.mainSite.address.longitude).toEqual(updateObject.mainSite.address.longitude);
      expect(dbCustomer.primaryBillingContact.firstName).toEqual(updateObject.billingContact.firstName);
      expect(dbCustomer.primaryBillingContact.lastName).toEqual(updateObject.billingContact.lastName);
      expect(dbCustomer.primaryBillingContact.title).toEqual(updateObject.billingContact.title);
      expect(dbCustomer.primaryBillingContact.contactTypes).toEqual(expect.arrayContaining(updateObject.billingContact.contactTypes));
      expect(dbCustomer.primaryBillingContact.phone).toEqual(updateObject.billingContact.phone);
      expect(dbCustomer.primaryBillingContact.email).toEqual(updateObject.billingContact.email);
      expect(dbCustomer.primaryTechnicalContact.firstName).toEqual(updateObject.technicalContact.firstName);
      expect(dbCustomer.primaryTechnicalContact.lastName).toEqual(updateObject.technicalContact.lastName);
      expect(dbCustomer.primaryTechnicalContact.title).toEqual(updateObject.technicalContact.title);
      expect(dbCustomer.primaryTechnicalContact.contactTypes).toEqual(expect.arrayContaining(updateObject.technicalContact.contactTypes));
      expect(dbCustomer.primaryTechnicalContact.phone).toEqual(updateObject.technicalContact.phone);
      expect(dbCustomer.primaryTechnicalContact.email).toEqual(updateObject.technicalContact.email);

      if(this.spContact) {
        expect(dbCustomer.accountManager).toEqual(this.spContact);
        expect(dbCustomer.projectManager).toEqual(this.spContact);
        expect(dbCustomer.supportManager).toEqual(this.spContact);  
      }

    } catch (error) {
      console.error('Error:', error);
    }
  },10000);
},10000);

//Sp customers should not be deleted

describe('Customer API', () => {
  it('SP customers should not be deleted', async () => {
    try {


      this.spContacts = await this.dbservice.getObjectListWithAggregate(CustomerContact, aggregate, null);
      this.spContact = this.spContacts.length > 0 ? this.spContacts[0]._id : null;
      if(this.spContact) {
        updateObject.accountManager = this.spContact.toString();
        updateObject.projectManager = this.spContact.toString();
        updateObject.supportManager = this.spContact.toString();
      } else {
        delete updateObject.accountManager;
        delete updateObject.projectManager;
        delete updateObject.supportManager;  
      }

      const response = await axios.patch(URL_update, updateObject, { headers });
      const customer = response.data.Customer._id;
      // console.log(customer, '@1')

      let dbCustomer = await this.dbservice.getObjectById(Customer, this.fields, customer, this.populate);
      expect(dbCustomer.name).toEqual(updateObject.name);
      expect(dbCustomer.tradingName).toEqual(updateObject.tradingName);
      expect(dbCustomer.type).toEqual("customer");
      expect(dbCustomer.mainSite.name).toEqual(updateObject.mainSite.name);
      expect(dbCustomer.mainSite.phone).toEqual(updateObject.mainSite.phone);
      expect(dbCustomer.mainSite.email).toEqual(updateObject.mainSite.email);
      expect(dbCustomer.mainSite.fax).toEqual(updateObject.mainSite.fax);
      expect(dbCustomer.mainSite.website).toEqual(updateObject.mainSite.website);
      expect(dbCustomer.mainSite.address.street).toEqual(updateObject.mainSite.address.street);
      expect(dbCustomer.mainSite.address.suburb).toEqual(updateObject.mainSite.address.suburb);
      expect(dbCustomer.mainSite.address.city).toEqual(updateObject.mainSite.address.city);
      expect(dbCustomer.mainSite.address.region).toEqual(updateObject.mainSite.address.region);
      expect(dbCustomer.mainSite.address.postcode).toEqual(updateObject.mainSite.address.postcode);
      expect(dbCustomer.mainSite.address.country).toEqual(updateObject.mainSite.address.country);
      expect(dbCustomer.mainSite.address.latitude).toEqual(updateObject.mainSite.address.latitude);
      expect(dbCustomer.mainSite.address.longitude).toEqual(updateObject.mainSite.address.longitude);
      expect(dbCustomer.primaryBillingContact.firstName).toEqual(updateObject.billingContact.firstName);
      expect(dbCustomer.primaryBillingContact.lastName).toEqual(updateObject.billingContact.lastName);
      expect(dbCustomer.primaryBillingContact.title).toEqual(updateObject.billingContact.title);
      expect(dbCustomer.primaryBillingContact.contactTypes).toEqual(expect.arrayContaining(updateObject.billingContact.contactTypes));
      expect(dbCustomer.primaryBillingContact.phone).toEqual(updateObject.billingContact.phone);
      expect(dbCustomer.primaryBillingContact.email).toEqual(updateObject.billingContact.email);
      expect(dbCustomer.primaryTechnicalContact.firstName).toEqual(updateObject.technicalContact.firstName);
      expect(dbCustomer.primaryTechnicalContact.lastName).toEqual(updateObject.technicalContact.lastName);
      expect(dbCustomer.primaryTechnicalContact.title).toEqual(updateObject.technicalContact.title);
      expect(dbCustomer.primaryTechnicalContact.contactTypes).toEqual(expect.arrayContaining(updateObject.technicalContact.contactTypes));
      expect(dbCustomer.primaryTechnicalContact.phone).toEqual(updateObject.technicalContact.phone);
      expect(dbCustomer.primaryTechnicalContact.email).toEqual(updateObject.technicalContact.email);

      if(this.spContact) {
        expect(dbCustomer.accountManager).toEqual(this.spContact);
        expect(dbCustomer.projectManager).toEqual(this.spContact);
        expect(dbCustomer.supportManager).toEqual(this.spContact);  
      }

    } catch (error) {
      console.error('Error:', error);
    }
  },10000);
},10000);

//deleted a customer

describe('Customer API', () => {
  it('Customer deleted when archive is true', async () => {
    try {


      this.spContacts = await this.dbservice.getObjectListWithAggregate(CustomerContact, aggregate, null);
      this.spContact = this.spContacts.length > 0 ? this.spContacts[0]._id : null;
      if(this.spContact) {
        updateObject.accountManager = this.spContact.toString();
        updateObject.projectManager = this.spContact.toString();
        updateObject.supportManager = this.spContact.toString();
      } else {
        delete updateObject.accountManager;
        delete updateObject.projectManager;
        delete updateObject.supportManager;  
      }

      const response = await axios.patch(URL_update, updateObject, { headers });
      const customer = response.data.Customer._id;
      // console.log(customer, '@1')

      let dbCustomer = await this.dbservice.getObjectById(Customer, this.fields, customer, this.populate);
      expect(dbCustomer.name).toEqual(updateObject.name);
      expect(dbCustomer.tradingName).toEqual(updateObject.tradingName);
      expect(dbCustomer.type).toEqual("customer");
      expect(dbCustomer.mainSite.name).toEqual(updateObject.mainSite.name);
      expect(dbCustomer.mainSite.phone).toEqual(updateObject.mainSite.phone);
      expect(dbCustomer.mainSite.email).toEqual(updateObject.mainSite.email);
      expect(dbCustomer.mainSite.fax).toEqual(updateObject.mainSite.fax);
      expect(dbCustomer.mainSite.website).toEqual(updateObject.mainSite.website);
      expect(dbCustomer.mainSite.address.street).toEqual(updateObject.mainSite.address.street);
      expect(dbCustomer.mainSite.address.suburb).toEqual(updateObject.mainSite.address.suburb);
      expect(dbCustomer.mainSite.address.city).toEqual(updateObject.mainSite.address.city);
      expect(dbCustomer.mainSite.address.region).toEqual(updateObject.mainSite.address.region);
      expect(dbCustomer.mainSite.address.postcode).toEqual(updateObject.mainSite.address.postcode);
      expect(dbCustomer.mainSite.address.country).toEqual(updateObject.mainSite.address.country);
      expect(dbCustomer.mainSite.address.latitude).toEqual(updateObject.mainSite.address.latitude);
      expect(dbCustomer.mainSite.address.longitude).toEqual(updateObject.mainSite.address.longitude);
      expect(dbCustomer.primaryBillingContact.firstName).toEqual(updateObject.billingContact.firstName);
      expect(dbCustomer.primaryBillingContact.lastName).toEqual(updateObject.billingContact.lastName);
      expect(dbCustomer.primaryBillingContact.title).toEqual(updateObject.billingContact.title);
      expect(dbCustomer.primaryBillingContact.contactTypes).toEqual(expect.arrayContaining(updateObject.billingContact.contactTypes));
      expect(dbCustomer.primaryBillingContact.phone).toEqual(updateObject.billingContact.phone);
      expect(dbCustomer.primaryBillingContact.email).toEqual(updateObject.billingContact.email);
      expect(dbCustomer.primaryTechnicalContact.firstName).toEqual(updateObject.technicalContact.firstName);
      expect(dbCustomer.primaryTechnicalContact.lastName).toEqual(updateObject.technicalContact.lastName);
      expect(dbCustomer.primaryTechnicalContact.title).toEqual(updateObject.technicalContact.title);
      expect(dbCustomer.primaryTechnicalContact.contactTypes).toEqual(expect.arrayContaining(updateObject.technicalContact.contactTypes));
      expect(dbCustomer.primaryTechnicalContact.phone).toEqual(updateObject.technicalContact.phone);
      expect(dbCustomer.primaryTechnicalContact.email).toEqual(updateObject.technicalContact.email);

      if(this.spContact) {
        expect(dbCustomer.accountManager).toEqual(this.spContact);
        expect(dbCustomer.projectManager).toEqual(this.spContact);
        expect(dbCustomer.supportManager).toEqual(this.spContact);  
      }

    } catch (error) {
      console.error('Error:', error);
    }
  },10000);
},10000);