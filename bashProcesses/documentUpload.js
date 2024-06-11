const mongoose = require('mongoose');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');


const PDFParser = require('pdf-parse');
const { parse } = require('json2csv');

const { DocumentCategory, DocumentType } = require('../appsrc/modules/documents/models');
const { ProductDrawing } = require('../appsrc/modules/products/models');
const { Product } = require('../appsrc/modules/products/models');
const util = require('util');
const readdir = util.promisify(fs.readdir);

const serverURL = 'http://localhost:5002/api/1.0.0';
// const serverURL = 'http://dev.portal.server.howickltd.com/api/1.0.0'; // DEV Environment

const email = "a.hassan@terminustech.com";
const password = "24351172";
const machineDataDirectory = '../Jobs Data'; // Change this to the root folder you want to start from
const targetDirectories = [ 'Assembly Drawings'];
const excludeDirectories = [ 'Archive' ];
const allowedExtension = ['.pdf']; // Array of allowed files
const disallowedExtension = []; // Array of disallowed files

var token = null;
var userId;
var sessionId;
var logging = [];
const filePath_ = getFormattedDate();
const mongoose__ = require('../appsrc/modules/db/dbConnection');
let index = 1

function getFormattedDate() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based, so add 1
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Concatenate parts without dots or dashes
    return `${year}${month}${day}${hours}${minutes}${seconds}.csv`;
}
async function main() {
    try {
        const authData = await getToken(serverURL, email, password);
        token = authData.token;
        userId = authData.userId;
        sessionId = authData.sessionId;


    } catch (error) {
        const authData = await getToken(serverURL, email, password);
        token = authData.token;
        userId = authData.userId;
        sessionId = authData.sessionId;
    }
    console.log("Document Checking Process Started!")
    await readFolders(machineDataDirectory, false );

    if(Array.isArray(logging) && logging.length > 0 && !logging.some((log)=> log.propertiesNotFound ) ){
        console.log("Document upload Process Started!")
    index = 1
    logging = [];
    await processFolders(machineDataDirectory , true);
    }


if(Array.isArray(logging) && logging.length > 0 && !logging.some((log)=> log.propertiesNotFound )  ){
    const csv = parse(logging);
        await fs.writeFile(filePath_, csv, async (err) => {
            if (err) {
                console.error('Error appending to CSV file:', err);
                return;
                process.exit(0)
            }
            console.log(`Documents records appended to CSV file Name: ${filePath_} in project diractory successfully.`);
            process.exit(0)
        });
} 
else if(Array.isArray(logging) && logging.length > 0 && logging.some((log)=> log.propertiesNotFound ) ){
        const csv = parse(logging);
        await fs.writeFile(filePath_, csv, async (err) => {
            if (err) {
                console.error('Error appending to CSV file:', err);
                return;
                process.exit(0)
            }
            console.log(`Please resolve defined issues in CSV file Name: ${filePath_} in project diractory before upload!`);
            process.exit(0)
        });
} 
else {
    console.log('No data Available to create CSV.');
    process.exit(0)
}

    async function readFolders(machineDataDirectory, isUpload) {
        try {
            const files = await readdir(machineDataDirectory);
            for (const file of files) {
                const filePath = path.join(machineDataDirectory, file);
                try {
                    const stats = await getFileStats(filePath, isUpload );
                } catch (err) {
                    console.error('Error occurred:', err);
                }
            }
        } catch (e) {
            if (e) {
                console.error('Error reading directory:', e);
                return;
            }
        }
    }

    async function processFolders(machineDataDirectory, isUpload) {
        try {
            const files = await readdir(machineDataDirectory);
            for (const file of files) {
                const filePath = path.join(machineDataDirectory, file);
                try {
                    await getFileStats(filePath, isUpload );
                } catch (err) {
                    console.error('Error occurred:', err);
                }
            }
        } catch (e) {
            if (e) {
                console.error('Error reading directory:', e);
                return;
            }
        }
    }

    async function getFileStats(filePath , isUploade ) {
        return new Promise((resolve, reject) => {
            fs.stat(filePath, async (err, stats) => {
                if (err) {
                    reject(err); // If there's an error, reject the Promise
                    console.error('Error checking file stats:', err);
                }
                // console.log( isUploade ? 'Reading Folder...' : 'Checking Files...');
                if (stats.isDirectory()) {
                    // Recursively read subfolders
                    if(isUploade){
                        await processFolders(filePath, isUploade );
                    } else {
                        await readFolders(filePath, isUploade);
                    }
                    resolve(stats);
                } else  {
                    // Check if the file is allowed or disallowed
                    const ETAG = await generateEtag(filePath);
                    const fileName = path.basename(filePath);
                    if ( allowedExtension.some(( ext )=> fileName?.toLowerCase()?.includes(ext.toLowerCase())) || !disallowedExtension.some(( ext )=> fileName?.toLowerCase()?.includes( ext.toLowerCase() )) ) {
                        const folders = filePath.split(path.sep);
                        
                        const loweCaseFilePath = filePath.toLowerCase();
                        if (!targetDirectories.some((el)=> loweCaseFilePath.includes(el.toLowerCase())) || excludeDirectories?.some((el)=> loweCaseFilePath.includes(el.toLowerCase())) ){
                            resolve(stats);
                            return;
                        }
                        console.log(`${index} - ${isUploade ? 'Uploading' : 'Checking' } - ${fileName}`);
                        index += 1;
                        const parentFolder = folders[folders.length - (folders.length - 2)];
                        const childFolder = folders[folders.length - 2];
                        let docxCategory = await fetchDocxCategory(childFolder);
                        if (!docxCategory)
                            docxCategory = { name: childFolder };

                        const fetchSerialNo = null;
                        // Regular expression to match the number before the hyphen
                        const regex = /^(\d+)\s-\s/;

                        // Extracting the number
                        const serialNumber__ = parentFolder.match(regex);

                        // If a match is found, extract the number
                        productObject = null;
                        if (serialNumber__ && serialNumber__[1]) {
                            let fetchSerialNo = serialNumber__[1].trim();
                            fetchSerialNo = fetchSerialNo.replaceAll(",", "");

                            if (fetchSerialNo) {
                                // productObject = await getMachineId(fetchSerialNo.trim())
                                productObject = await Product.findOne({ serialNo: fetchSerialNo.trim() }).select('_id serialNo').lean();
                            }
                        } else {
                            console.log(`Machine with serialNo ${serialNumber__} not found! `);
                        }

                        let searchedObject = null;
                        let etags = [];
                        etags.push(ETAG);
                        const data_ = await checkFileExistenceByETag(etags);
                        let isFileETAGAlreadyExist = false;
                        if (data_[0]?.documentFiles) {
                            isFileETAGAlreadyExist = true;
                            console.log(`Document ETag already exists`)
                            searchedObject = await data_.flatMap(item => item.documentFiles).find(file => file?.eTag?.toString() === ETAG.toString());
                        }

                        let justDrawingInsertedThroughScript = false;
                        let isMachineDrawingAlreadyExists = false;

                        if (searchedObject) {
                            const query_Search_Drawing = { document: searchedObject.document, machine: productObject._id };
                            isMachineDrawingAlreadyExists = await ProductDrawing.findOne(query_Search_Drawing);
                            if (!isMachineDrawingAlreadyExists) {
                                const payload = {
                                    "machine": productObject._id,
                                    "documentId": searchedObject.document,
                                    "isActive": true
                                }
                                const drawingAttached__ = await attachDrawingToMachine(payload);
                                justDrawingInsertedThroughScript = true;
                            }
                        }

                        let regex_ = /^(\w+)\s([\w\s]+)/;
                        let pattern = /\s*[vV]\s*\d+(\.\d+)?\s*$/;
                        let matches = fileName.match(regex_);
                        try{
                            referenceNumber = matches[1]; // Example: "35634a"
                            docxType = matches[2].trim(); // Example: "Hyd Pump"    
                            if (pattern.test(docxType)) {
                                docxType = docxType.replace(pattern, '');
                            }
                        } catch (Exception){
                            referenceNumber = '';
                            docxType = '';        
                        }
                        
                        let docxTypeDB;
                        if(docxCategory?._id)
                            docxTypeDB = await fetchDocxType(docxType, docxCategory?._id);

                        if (!docxTypeDB)
                            docxTypeDB = { name: docxType };

                        const regex_VersionNo = /V(\d+)\.pdf$/;
                        const matches_Version = fileName.match(regex_VersionNo);
                        const versionNumber = matches_Version ? matches_Version[1] : 1;
                        const pdfData = fs.readFileSync(filePath);
                        isMachineDrawingAlreadyExists = isMachineDrawingAlreadyExists ? true : false;
                        const objectValues = {
                            pdfData, filePath_, referenceNumber, versionNumber, docxCategory, docxTypeDB,
                            childFolder, productObject, fileName, filePath, isMachineDrawingAlreadyExists, justDrawingInsertedThroughScript, isFileETAGAlreadyExist,
                        }
                        const data_log = await parsePDFAndLog(objectValues);

                        const propertiesNotFound = await checkKeyValues(data_log);
                        if (propertiesNotFound && propertiesNotFound?.length != 0) {
                            data_log.propertiesNotFound = propertiesNotFound;
                        } else if(isUploade) {
                            if (!data_log.isMachineDrawingAlreadyExists && !data_log.isMachineDrawingAttached) {
                                if (!data_log.propertiesNotFound || data_log.propertiesNotFound?.length === 0) {
                                    try {
                                        const response = await uploadDocument(data_log);
                                        data_log.uploadedSuccessfully = true;
                                        console.log(`Document *** ${fileName} *** Uploaded successfully!`)
                                    } catch (error) {
                                        data_log.errorWhileUploading = true;
                                        console.error('Error:', error);
                                    }
                                } else {
                                    data_log.ignoredDueToInvalidData = true;
                                }
                            }
                        }

                        logging.push(data_log);

                        resolve(stats);

                    } else {
                        resolve(stats);
                    }
                }
            });
        });
    }

    async function parsePDFAndLog(obj) {
        return new Promise((resolve, reject) => {
            PDFParser(obj.pdfData).then(async function (data) {
                // Extract text from PDF
                const pdfText = data.text;

                // Split text by newline character
                const lines = pdfText.split('\n');

                // Search for "STOCK NO" column
                let stockNoValue = null;
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes('STOCK NO.')) {
                        stockNoValue = lines[i - 3].trim();
                        if (stockNoValue === 'DRAWN BY') {
                            stockNoValue = lines[i - 2].trim();
                        }
                        break;
                    }
                }

                let logging = {
                    folderName: obj.childFolder,
                    machine_serialNo: obj.productObject?.serialNo,
                    machine_Id: obj.productObject?._id,
                    documentCategory_Id: obj.docxCategory?._id,
                    documentCategoryName: obj.docxCategory?.name,
                    documentType_Id: obj.docxTypeDB?._id,
                    documentTypeName: obj.docxTypeDB?.name,
                    displayName: obj.fileName,
                    name: obj.fileName,
                    versionNo: obj.versionNumber,
                    referenceNumber: obj.referenceNumber,
                    stockNumber: stockNoValue,
                    customerAccess: false,
                    isActive: true,
                    imagePath: obj.filePath,
                    isFileETAGAlreadyExist: obj.isFileETAGAlreadyExist,
                    isMachineDrawingAlreadyExists: obj.isMachineDrawingAlreadyExists ? true : false,
                    isMachineDrawingAttached: obj.justDrawingInsertedThroughScript
                };
                resolve(logging);
            }).catch(function (error) {
                console.log(error);
                reject(error);
            });
        });
    }



    async function parsePDFAndLogData(pdfData) {
        try {
            const data = await PDFParser(pdfData);

            // Extract text from PDF
            const pdfText = data.text;

            // Split text by newline character
            const lines = pdfText.split('\n');

            // Search for "STOCK NO" column
            let stockNoValue = null;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('STOCK NO.')) {
                    stockNoValue = lines[i - 3].trim();
                    if (stockNoValue === 'DRAWN BY') {
                        stockNoValue = lines[i - 2].trim();
                    }
                    break;
                }
            }

            let recordValues = {
                machine_serialNo: productObject?.serialNo,
                stockNoValue: stockNoValue,
                refNumber: refNumber,
                versionNumber: versionNumber,
                docxCategory: docxCategory?.name,
                docxType_DB: docxTypeDB?.name,
                childFolder: childFolder,
            };

            logging.push(recordValues);
        } catch (error) {
            console.log(error);
        }
    }

    async function fetchDocxCategory(categoryName) {
        if (categoryName && categoryName.trim().length > 0) {
            return await DocumentCategory.findOne({
                name: { $regex: new RegExp('^' + categoryName.trim(), 'i') },
                isActive: true,
                isArchived: false,
                drawing: true
            }).select('_id name').lean();
        } else {
            console.log(`Document Category ${categoryName} not found!`);
            return null;
        }
    }

    async function fetchDocxType(categoryName, categoryID) {
        if (categoryName && categoryName.trim().length > 0) {
            return await DocumentType.findOne({
                name: { $regex: new RegExp('^' + categoryName.trim(), 'i') },
                isActive: true,
                isArchived: false,
                docCategory: categoryID
            }).select('_id name').lean();
        } else {
            console.log(`Document Type ${categoryName} not found!`);
            return null;
        }
    }

    async function uploadDocument(data) {
        try {
            const { folderName, machine_serialNo, machine_Id, documentCategory_Id, documentCategoryName, documentType_Id,
                documentTypeName, displayName, name, versionNo, referenceNumber, stockNumber,
                customerAccess, isActive, imagePath, isMachineDrawingAlreadyExists, isMachineDrawingAttached } = data;

            // Read the image file
            const imageData = fs.readFileSync(imagePath);
            // Create form data
            const formData = new FormData();

            formData.append('drawingMachine', machine_Id?.toString());

            formData.append('customerAccess', customerAccess?.toString());

            formData.append('isActive', isActive?.toString());

            formData.append('displayName', displayName);

            formData.append('name', name);

            formData.append('documentCategory', documentCategory_Id?.toString());
            formData.append('documentType', documentType_Id?.toString());

            formData.append('doctype', documentType_Id?.toString());
            formData.append('images', imageData, { filename: path.basename(imagePath) });
            // Send Axios request
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            const response = await axios.post(`${serverURL}/documents/document/`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundarybBvDZ5x1fsIv303C',
                    'Authorization': `Bearer ${token}` // Add the Authorization header with the bearer token
                }
            });


            return response.data;
        } catch (error) {
            throw error;
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

}

async function getToken(serverURL, email, password) {
    try {
        const tokenResponse = await axios.post(`${serverURL}/security/getToken`, { email, password });
        const { accessToken, userId, sessionId } = tokenResponse.data;
        return { token: accessToken, userId, sessionId };
    } catch (error) {
        console.error('Error fetching token:', error);
        throw error;
    }
}

async function checkFileExistenceByETag(etagValue) {
    const url = `${serverURL}/documents/checkFileExistenceByETag`;
    try {
        const response = await axios.get(url, {
            params: {
                eTags: etagValue // Assuming etagValue is an array
            },
            headers: {
                'Content-Type': 'application/json', // Assuming the endpoint expects JSON content type
                'Authorization': `Bearer ${token}` // Add the Authorization header with the bearer token
            }
        });
        // Assuming the response contains relevant data about file existence
        return response.data;
    } catch (error) {
        // Handle errors, e.g., network errors, server errors
        console.error('Error:', error.message);
        throw error;
    }
}

async function getMachineId(serialNo) {
    const url = `${serverURL}/products/machines/searchProductId?serialNo=${serialNo}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            // body: JSON.stringify(payLoad)
        });
        if (!response.ok) {
            return response?.statusText
        }

        // Parse the response JSON
        const responseData = await response.json();
        return responseData;
    } catch (error) {
        // Handle errors
        console.error('Error:', error.message);
        throw error;
    }
}


async function attachDrawingToMachine(payLoad) {
    const url = `${serverURL}/products/drawings`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payLoad)
        });

        if (!response.ok) {
            // Handle non-200 status codes
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Parse the response JSON
        const responseData = await response.json();
        return responseData;
    } catch (error) {
        // Handle errors
        console.error('Error:', error.message);
        throw error;
    }
}

async function checkKeyValues(properties) {
    let emptyProperties = [];
    let result;

    const keys_Values = { ...properties };

    // Remove specific keys from the copied object
    delete keys_Values.isMachineDrawingAttached;
    delete keys_Values.uploadedSuccessfull;
    delete keys_Values.customerAccess;
    delete keys_Values.documentTypeName;
    delete keys_Values.isMachineDrawingAlreadyExists;
    delete keys_Values.documentCategoryName;
    delete keys_Values.isFileETAGAlreadyExist;






    // Check if there are any properties left in the object
    if (keys_Values && Object.keys(keys_Values).length > 0) {
        result = Object.entries(keys_Values).map(([key, value]) => {
            if (!value || value.toString().length === 0) {
                emptyProperties.push(key);
                return `${key}: [EMPTY]`;
            }
        });


        // Add information about empty properties
        if (emptyProperties.length > 0) {
            result = `${emptyProperties.join(', ')}`;
        }
        if (Array.isArray(result)) {
            result = await result.filter(Boolean);
        }
        return result;
    } else {
        return result = null;
    }

}


main();