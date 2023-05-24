require("dotenv").config();
const mongoose = require('../../../../appsrc/modules/db/dbConnection');

class environment {
    constructor() {
      this.host_Url = "http://"+process.env.HOST_NAME+':'+process.env.PORT+process.env.API_ROOT;
      this.accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDM4YmJiZTU4MGYwYzQ0MGQyNWQyMzMiLCJlbWFpbCI6Im11em5hZmFyb29xMjFAZ21haWwuY29tIiwiaWF0IjoxNjg0OTI2MDEwLCJleHAiOjE2ODQ5MzMyMTB9.24bYY7EVIS6rflVVt8vYhs6wl5iI937dR_GcQRLrb40";
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