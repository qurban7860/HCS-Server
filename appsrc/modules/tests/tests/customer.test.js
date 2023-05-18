const axios = require('axios');
const environment = require('./environment');
const env = new environment();

const moduleName = '/crm/customers/';
const URL = env.getHost_Url() + moduleName;
const headers = env.getHeaders();

describe('Customer API', () => {
  it('should create a new customer', async () => {
    const newCustomer = {
      name: '',
      tradingName: 'Airbrush Artist',
      type: 'SP',
      mainSite: {
        name: 'Muzna',
        phone: '+64 21 23433242323',
        email: 'test@gmail.com',
        fax: '+64 22 34543543345',
        website: 'www.test.com',
        address: {
          street: 'Vincent Street',
          suburb: 'Howick',
          city: 'Auckland',
          region: 'Auckland',
          postcode: '1410',
          country: 'NZ',
          latitude: '120898',
          longitude: '77989',
        },
      },
      billingContact: {
        firstName: 'Dave',
        lastName: 'Hayman',
        title: 'Manager',
        contactTypes: ['financial'],
        phone: '+64 3454345343',
        email: 'tes@gmail.com',
      },
      technicalContact: {
        firstName: 'Dave11',
        lastName: 'Hayman11',
        title: 'Manager',
        contactTypes: ['technical'],
        phone: '+64 3454345343',
        email: 'tes@gmail.com',
      },
      accountManager: null,
      projectManager: null,
      supportManager: '63ee270a07a2cfba8be45564',
    };
    console.log('abcccccccccccccccccc');
    try {
      const response = await axios.post(URL, newCustomer, { headers });
      console.log(response);
    //   expect(response.status).toBe(200); // Assuming 200 is the status code for a successful creation
    //   expect(response.data).toEqual(newCustomer);

    //   console.log(response.data);
    } catch (error) {
    //   console.error('Error:', error.response.data);
    }
  });
});
