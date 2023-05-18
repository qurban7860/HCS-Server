require("dotenv").config();

class environment {
    constructor() {
      this.host_Url = "http://"+process.env.HOST_NAME+':'+process.env.PORT+process.env.API_ROOT;
      this.accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDM4YmJiZTU4MGYwYzQ0MGQyNWQyMzMiLCJlbWFpbCI6Im11em5hZmFyb29xMjFAZ21haWwuY29tIiwiaWF0IjoxNjg0Mzk3MTY0LCJleHAiOjE2ODQ0MDQzNjR9.mLLFuyBMCiwNFbFXY4b74ZP-KmWUepK2mlJrH7R8vzI";
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