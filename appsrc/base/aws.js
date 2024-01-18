const { promisify } = require('util');
const AWS = require('aws-sdk');
const fs = require('fs');
const sharp = require('sharp');

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

// const credentials = new AWS.Credentials('xxxx', 'xxxxxx');
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
  let data = null;

  const uploadFileParams = {
    Bucket: bucketName,
    Key: `${folder}/${filename}.${ext}`,
    Body: content,
    // ACL:'public-read'
  };

  try {
    data = await s3UploadAsync(uploadFileParams);
    if ('Key' in data && 'ETag' in data) {
      data.awsETag = data.ETag.replace(/"/g, '');
    } else {
      console.log('Location not found, inside services/aws.js');
      console.log(data);
    }
  } catch (ex) {
    console.log('exception occurred while uploading image (S3), inside services/aws.js');
    console.log(ex.message);
  }

  return data;
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


const mailcomposer = require('mailcomposer');

async function sendEmailWithRawData(params, file) {
  const mail = mailcomposer({
    from: process.env.AWS_SES_FROM_EMAIL,
    to: params.to,
    subject: params.subject,
    html : params.htmlData,
    attachments: [
      {
        filename: file.originalname,
        content: file.buffer
      },
    ],
  });
  
  mail.build(async (err, message) => {
    if (err) {
      console.error(`Error sending raw email: ${err}`);
    }
    let SES = new AWS.SES({region: process.env.AWS_REGION})
    let response = await SES.sendRawEmail({RawMessage: {Data: message}}).promise();
    console.log(response);
  }); 
}


async function downloadFileS3(filePath) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: filePath
  };

  try {
    const data = await s3.getObject(params).promise();
    return data.Body;
  } catch (err) {
    console.log(err.message);
    return err;
  }
}

async function fetchAWSFileInfo(fileid, filePath) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: filePath
  };

  try {
    return data = await s3.getObject(params).promise();
  } catch (err) {
    console.log("file fetch error", err.message);
    return err;
  }
}

async function generateEtag(data) {
  const crypto = require('crypto');
  const md5sum = crypto.createHash('md5');

  let stream;
  if (typeof data === 'string') {
    // If data is a string, assume it's a file path
    stream = fs.createReadStream(data);
  } else if (Buffer.isBuffer(data)) {
    // If data is a buffer, create a readable stream from the buffer
    stream = require('stream').Readable.from(data);
  } else {
    // If the input is neither a string nor a buffer, reject with an error
    return Promise.reject(new Error('Invalid input. Please provide a file path or a buffer.'));
  }

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => {
      md5sum.update(chunk);
    });

    stream.on('end', () => {
      let etag = `"${md5sum.digest('hex')}"`;
      etag = etag.replace(/ /g, "").replace(/"/g, "");
      resolve(etag);
    });

    stream.on('error', (error) => {
      reject(error);
    });
  });
}

async function getImageResolution(imageBuffer) {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width;
    const height = metadata.height;
    
    console.log(`Image Resolution: ${width} x ${height}`);
    
    // You can return the resolution or perform other actions as needed
    return { width, height };
  } catch (err) {
    console.error('Error reading image metadata:', err);
    throw err; // Propagate the error or handle it as per your application's requirements
  }
}

async function calculateDesiredQuality(imageBuffer, imageResolution) {
  let desiredQuality = 100;

  // Set thresholds based on image size
  const sizeThresholds = {
    small: 2 * 1024 * 1024, // 2MB
    medium: 5 * 1024 * 1024, // 5MB
    large: 10 * 1024 * 1024, // 10MB
    extraLarge: 20 * 1024 * 1024, // 20MB
  };

  // Set resolution thresholds
  const resolutionThresholds = {
    low: 800,  // Low resolution threshold (e.g., 800 pixels)
    medium: 1200, // Medium resolution threshold (e.g., 1200 pixels)
    high: 2000, // High resolution threshold (e.g., 2000 pixels)
    extraHigh: 3000, // Extra high resolution threshold (e.g., 3000 pixels)
  };

  const imageSize = imageBuffer.length;
  const imageWidth = imageResolution.width;

  // Adjust quality based on image size
  if (imageSize > sizeThresholds.extraLarge) {
    desiredQuality = 5; // Aggressive reduction for extra-large images
  } else if (imageSize > sizeThresholds.large) {
    desiredQuality = 10; // Moderate reduction for large images
  } else if (imageSize > sizeThresholds.medium) {
    desiredQuality = 20; // Moderate reduction for medium-sized images
  } else {
    desiredQuality = 30; // Default quality for smaller images
  }

  // Adjust quality based on image resolution
  if (imageWidth < resolutionThresholds.low) {
    desiredQuality += 10; // Increase quality for low-resolution images
  } else if (imageWidth > resolutionThresholds.extraHigh) {
    desiredQuality -= 10; // Decrease quality for extra high-resolution images
  }

  // Ensure the desired quality stays within a reasonable range
  desiredQuality = Math.max(10, Math.min(100, desiredQuality));
  return desiredQuality;
}

const processImageFile = async (docx) => {
  if (docx.mimetype.includes('image')) {
    let imageResolution = await getImageResolution(docx.path);
    let desiredQuality = await calculateDesiredQuality(docx.path, imageResolution);
    const buffer = await sharp(docx.path)
      .jpeg({
        quality: desiredQuality,
        mozjpeg: true
      })
      .toBuffer();
    const fileSizeInBytes = Buffer.byteLength(buffer);
    const fileSizeInKilobytes = fileSizeInBytes / 1024;
    const fileSizeInMegabytes = fileSizeInKilobytes / 1024;
    console.log(`File Size After : ${fileSizeInMegabytes.toFixed(2)} MB`);
    console.log(`File Size: ${fileSizeInKilobytes.toFixed(2)} KB`);
    const base64String = buffer.toString('base64');
    docx.buffer = base64String;
  }
};

module.exports = {
  sendEmail,
  sendEmailWithRawData,
  uploadFileS3,
  checkFileHeader,
  copyFile,
  listBuckets,
  downloadFileS3,
  fetchAWSFileInfo,
  generateEtag,
  processImageFile,
  s3
};
