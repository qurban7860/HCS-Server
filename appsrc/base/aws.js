const { promisify } = require('util');
const AWS = require('aws-sdk');

// ############################ START: S3 ############################

/**
 * AWS Credentials, loaded from the shared credentials file (~/.aws/credentials)
 * Here is file content
 * [default]
 * aws_access_key_id = AWS_ACCESS_KEY_ID
 * aws_secret_access_key = AWS_SECRET_ACCESS_KEY
 *
 * AWS Credentials (loaded from Environment Variables)
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_SESSION_TOKEN (optional)
 *
 * AWS Credentials (in source code)
 * const credentials = new AWS.Credentials([AWS_ACCESS_KEY_ID], [AWS_SECRET_ACCESS_KEY]);
 * const s3 = new AWS.S3({
 *  region: [AWS_S3_REGION],
 *  params: { Bucket: [BUCKET_NAME] },
 *  credentials
 * });
 *
 */

// const credentials = new AWS.Credentials('AKIA5NXIO6FUAC7JW55U', 'LmKqh3ynZT/HdWlID9N4nynevgt527P/a07gfnvA');
const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  params: { Bucket: process.env.AWS_S3_BUCKET },
  // credentials
});

const s3UploadAsync = promisify(s3.upload).bind(s3);

async function checkFileHeader(path) {
  let params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: path
  };
  try{
    await s3.headObject(params).promise();
    return s3.getSignedUrl('getObject', params);
  }catch(e) {
    console.log(e.message);
    return false;
  }
}

async function listBuckets(params) {
  return await s3.listBuckets(params).promise();
}


async function copyFile(user) {
  let oldFileName = user._id;
  let bucketName = process.env.AWS_S3_BUCKET;
  let oldFileFolder = `profile_image/${oldFileName}.txt`;
  let oldFilePath = `${bucketName}/${oldFileFolder}`;
  let newFilePath = `profile_image/1_${oldFileName}_1.txt`
  const copyData = await s3.copyObject({
    Bucket: bucketName, 
    CopySource: oldFilePath, 
    Key: newFilePath,
    ACL:'public-read'
  }).promise();
  
  if(copyData && copyData.CopyObjectResult) {
    user.image = process.env.BASE_S3_LINK+newFilePath;
    await user.save();
    const deleteData = await s3.deleteObject({
      Bucket: bucketName,
      Key: oldFileFolder
    }).promise();
    return process.env.BASE_S3_LINK+newFilePath;
  }
}

async function uploadFileS3(filename, folder, content, ext = 'txt') {
  let bucketName = process.env.AWS_S3_BUCKET;

  const uploadFileParams = {
    Bucket: bucketName,
    Key: `${folder}/${filename}.${ext}`,
    Body: content,
    // ACL:'public-read'
  };

  let url = '';

  try {
    const data = await s3UploadAsync(uploadFileParams);

    if ('Key' in data) {
      url = data.Key;
    } else {
      console.log('Location not found, inside services/aws.js');
      console.log(data);
    }
  } catch (ex) {
    console.log('exception occurred while uploading image (S3), inside services/aws.js');
    console.log(ex.message);
  }

  return url;
}

const secretManager = new AWS.SecretsManager({
  region: process.env.AWS_REGION
});

const getSecretValueAsync = promisify(secretManager.getSecretValue).bind(secretManager);
// const listSecretsAsync = promisify(secretManager.listSecrets).bind(secretManager);

async function getSecretValue(secretName) {
  const data = await getSecretValueAsync({ SecretId: secretName });
  // const data = await listSecretsAsync({ Filters: [] });
  console.log('data, inside services/aws.js');
  console.log(data);

  let secret, decodedBinarySecret;

  if ('SecretString' in data) {
    secret = data.SecretString;
  } else {
    let buff = new Buffer(data.SecretBinary, 'base64');
    decodedBinarySecret = buff.toString('ascii');
  }

  return secret;
}

async function sendEmail(params) {
  // Create sendEmail params 
  let emailParams = {
    Destination: { /* required */
      ToAddresses: [
        params.to,
      ]
    },
    Message: { /* required */
      Body: { /* required */
        
        Text: {
          Charset: "UTF-8",
          Data: params.body
        }
       },
       Subject: {
        Charset: 'UTF-8',
        Data: params.subject
       }
      },
    Source: process.env.AWS_SES_FROM_EMAIL, /* required */
    ReplyToAddresses: [
      process.env.AWS_SES_FROM_EMAIL,
    ],
  };

  if(params.html) {
    emailParams.Message.Body = {
      Html: {
        Charset: "UTF-8",
        Data: params.htmlData
      }
    }
  }
  // Create the promise and SES service object
  let SES = new AWS.SES({region: process.env.AWS_REGION})
  SES.sendEmail(emailParams, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
    /*
    data = {
    MessageId: "EXAMPLE78603177f-7a5433e7-8edb-42ae-af10-f0181f34d6ee-000000"
    }
    */
  });

  
}

async function downloadFileS3(filePath) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: filePath
  };

  try {
    const data = await s3.getObject(params).promise();
    console.log('data------------>', data);
    return data.Body;
  } catch (err) {
    console.log(err.message);
    return err;
  }
}

module.exports = {
  sendEmail,
  uploadFileS3,
  checkFileHeader,
  copyFile,
  listBuckets,
  downloadFileS3
};
