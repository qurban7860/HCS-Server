require("dotenv").config();
const mongoose = require('../../../../appsrc/modules/db/dbConnection');

class environment {
    constructor() {
      this.host_Url = "http://"+process.env.HOST_NAME+':'+process.env.PORT+process.env.API_ROOT;
      this.accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDE3NjA3M2ZjMzMwNjc5NGY2ZTI3ZjQiLCJlbWFpbCI6ImhhcmlzYWhtYWFkQGdtYWlsLmNvbSIsImlhdCI6MTY4NDkxOTAzMCwiZXhwIjoxNjg0OTI2MjMwfQ.Hf6dmH2uXuJLKtPIdafOs9Ihd7S_YeUdoSjV5HOnMz8";
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