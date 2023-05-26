require("dotenv").config();
const mongoose = require('../../../../appsrc/modules/db/dbConnection');

class environment {
    constructor() {
      this.host_Url = "http://"+process.env.HOST_NAME+':'+process.env.PORT+process.env.API_ROOT;
      this.accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDM4YmJiZTU4MGYwYzQ0MGQyNWQyMzMiLCJlbWFpbCI6Im11em5hZmFyb29xMjFAZ21haWwuY29tIiwiaWF0IjoxNjg0OTkwMDkxLCJleHAiOjE2ODQ5OTcyOTF9.LP7y0wG6Tb1eL7UgqmHl-8Rs9PUb3S1bAg1HMmIbPpA";
    }
  
    getHost_Url() {
      return this.host_Url;
    }

    getHeaders() {
      return {
        Authorization: `Bearer ${this.accessToken}`
      };
    }
    
  }
  
  // Export the environment class
  module.exports = environment;