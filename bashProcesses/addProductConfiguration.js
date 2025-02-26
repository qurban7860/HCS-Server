const http = require('http');
const port = 3010;
const axios = require('axios');
const simpleFs = require('fs');
const fs = simpleFs.promises;
const pathToIniFile = '';
const serverAPIURL = 'https://portal.server.howickltd.com/api/1.0.0';
const email = "awais@terminustech.com";
const password = "123456";

const tokenResponse = await axios.post(`${serverAPIURL}/security/getToken`, { email, password });

if(tokenResponse && tokenResponse.status==200 && tokenResponse.data) {
  const token = tokenResponse.data.accessToken;
  const userId = tokenResponse.data.userId;
  const sessionId = tokenResponse.data.sessionId;

  const isFileExists = simpleFs.existsSync(pathToIniFile);

  if(!isFileExists) {
    console.log('INI File doest Exists');
    return false;
  }

  const data = await fs.readFile(pathToIniFile);
  if(data) {

    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    const bodyParameters = {
      apiType: 'INI',
      response:'APPROVED',
      inputGUID:'',
      inputSerialNo:'',
      responseStatusCode:'',
      refUUID:'',
      backupid:'',
      machine:'',
      configuration:'',//JSON
      isActive:true,
      isArchived:false,
    };

    const configReqestResponse = await axios.post( 
      `${serverAPIURL}/apiclient/productConfigurations`,
      bodyParameters,
      config
    );
    if(configReqestResponse && configReqestResponse.status==200 && configReqestResponse.data) {
      console.log("configReqestResponse",configReqestResponse.data);
    }
    else {
      console.log('Request Failed to submit productConfigurations');
    }
  }
  else {
    console.log('Unable to read INI file or INI file is empty');
  }
}
else {
  console.log('Unable to validate user.Please check email / password')
}
