const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const serverAPIURL = 'http://localhost:5002/api/1.0.0';

const mongoose = require('mongoose');
const PDFParser = require('pdf-parse');
const { parse } = require('json2csv');

const { DocumentCategory, DocumentType } = require('../appsrc/modules/documents/models');
const { ProductDrawing } = require('../appsrc/modules/products/models');
const { Product } = require('../appsrc/modules/products/models');
const util = require('util');
const readdir = util.promisify(fs.readdir);


const email = "awais@terminustech.com";
const password = "123456";
const directoryPath = '../Drawings-Documents'; // Change this to the root folder you want to start from
const allowedExtension = ['.pdf']; // Array of allowed files
const disallowedExtension = []; // Array of disallowed files

var token = null;
var userId;
var sessionId;
var logging = [];
const filePath_ = 'output.csv';
const mongoose__ = require('../appsrc/modules/db/dbConnection');
async function main() {
    try {
        const authData = await getToken(serverAPIURL, email, password);
        token = authData.token;
        userId = authData.userId;
        sessionId = authData.sessionId;

        await readFolders(directoryPath, allowedExtension, disallowedExtension);
        console.log("end.....", logging); // Move the logging here

        // logging.forEach(element => {
        //     console.table({element});
        // });



        // const data = {
        //     drawingMachine: '65fbfea933642b7654864583',
        //     referenceNumber: 'abc',
        //     stockNumber: 'abc',
        //     versionNo: '1',
        //     displayName: 'abc',
        //     name: 'abc',
        //     documentCategory: '64870ed255a6241ba5bd9771',
        //     documentType: '64adda74b609da2a17f9709f',
        //     doctype: '64adda74b609da2a17f9709f',
        //     customerAccess: false,
        //     isActive: true,
        //     imagePath: filePath
        // };

        // uploadDocument(data)
        //     .then(response => {
        //         console.log('Response:', response);
        //     })
        //     .catch(error => {
        //         console.error('Error:', error);
        //     });



    } catch (error) {
        console.error('Error:', error);
    }


    async function readFolders(directoryPath) {
        try {
            console.log("@1");
            const files = await readdir(directoryPath);
            for (const file of files) {
                const filePath = path.join(directoryPath, file);
                console.log("File Path: ", filePath);

                try {
                    const stats = await getFileStats(filePath);
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


    async function getFileStats(filePath) {
        return new Promise((resolve, reject) => {
            fs.stat(filePath, async (err, stats) => {
                if (err) {
                    reject(err); // If there's an error, reject the Promise
                    console.error('Error checking file stats:', err);
                }

                if (stats.isDirectory()) {
                    // Recursively read subfolders
                    await readFolders(filePath, allowedExtension, disallowedExtension);
                } else {
                    // Check if the file is allowed or disallowed
                    const ETAG = await generateEtag(filePath);

                    const fileName = path.basename(filePath);
                    if (fileName.includes(allowedExtension)) {
                        const folders = filePath.split(path.sep);
                        const parentFolder = folders[folders.length - 3];
                        const childFolder = folders[folders.length - 2];
                        const docxCategory = await fetchDocxCategory(childFolder);
                        const fetchSerialNo = null;
                        // Regular expression to match the number before the hyphen
                        const regex = /^(\d+)\s-\s/;

                        // Extracting the number
                        const match = parentFolder.match(regex);

                        // If a match is found, extract the number
                        productObject = null;
                        if (match && match[1]) {
                            let fetchSerialNo = match[1].trim();
                            fetchSerialNo = fetchSerialNo.replaceAll(",", "");

                            if (fetchSerialNo) {
                                productObject = await Product.findOne({ serialNo: fetchSerialNo.trim() }).select('_id serialNo').lean();
                            }

                        } else {
                            console.log("Number not found before hyphen.");
                        }


                        let searchedObject = null;
                        let etags = [];
                        etags.push(ETAG);
                        const data_ = await checkFileExistenceByETag(etags);

                        searchedObject = await data_.flatMap(item => item.documentFiles).find(file => file.eTag.toString() === ETAG.toString());


                        const query_Search_Drawing = { document: searchedObject.document, machine: productObject._id };
                        const drawingAlreadyExists = await ProductDrawing.findOne(query_Search_Drawing);

                        let justDrawingInsertedThroughScript = false;
                        if (!drawingAlreadyExists) {
                            const payload = {
                                "machine": productObject._id,
                                "documentId": searchedObject.document,
                                "isActive": true
                            }
                            const drawingAttached__ = await attachDrawingToMachine(payload);
                            justDrawingInsertedThroughScript = true;
                        } else {
                            console.log("Drawing found! ***");
                        }

                        // Parse PDF
                        const regex_ = /^(\w+)\s([\w\s]+)/;
                        const matches = fileName.match(regex_);
                        const refNumber = matches[1]; // "35634a"
                        const docxType = matches[2].trim(); // "Hyd Pump"
                        const docxTypeDB = await fetchDocxType(docxType);
                        const regex_VersionNo = /V(\d+)\.pdf$/;
                        const matches_Version = fileName.match(regex_VersionNo);
                        const versionNumber = matches_Version ? matches_Version[1] : null;



                        const pdfData = fs.readFileSync(filePath);

                        const objectValues = {
                            pdfData, filePath_, refNumber, versionNumber, docxCategory, docxTypeDB,
                            childFolder, productObject, fileName, filePath, drawingAlreadyExists, justDrawingInsertedThroughScript
                        }
                        const data_log = await parsePDFAndLog(objectValues);
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
                    serialNo_DB: obj.productObject?.serialNo,
                    drawingMachine: obj.productObject?._id,
                    documentCategory: obj.docxCategory?.name,
                    documentType: obj.docxTypeDB?.name,
                    displayName: obj.fileName,
                    name: obj.fileName,
                    versionNo: obj.versionNumber,
                    referenceNumber: obj.refNumber,
                    stockNumber: stockNoValue,
                    customerAccess: false,
                    isActive: true,
                    imagePath: obj.filePath,
                    drawingAlreadyExists: obj.drawingAlreadyExists ? true : false,
                    drawingInsertedScript: obj.justDrawingInsertedThroughScript
                };

                // Append logging data to CSV
                const csv = parse([logging]);
                await fs.appendFile(obj.filePath_, csv, async (err) => {
                    if (err) {
                        console.error('Error appending to CSV file:', err);
                        reject(err);
                        return;
                    }
                    console.log('Records appended to CSV file successfully.');
                });

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
                serialNo_DB: productObject?.serialNo,
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
                isArchived: false
            }).select('_id name').lean();
        } else {
            return null;
        }
    }

    async function fetchDocxType(categoryName) {
        if (categoryName && categoryName.trim().length > 0) {
            return await DocumentType.findOne({
                name: { $regex: new RegExp('^' + categoryName.trim(), 'i') },
                isActive: true,
                isArchived: false
            }).select('_id name').lean();
        } else {
            return null;
        }
    }

    async function uploadDocument(data) {
        try {
            const { drawingMachine, customerAccess, isActive, displayName, name, documentCategory, documentType, doctype, imagePath } = data;

            // Read the image file
            const imageData = fs.readFileSync(imagePath);

            // Create form data
            const formData = new FormData();
            formData.append('drawingMachine', drawingMachine);
            formData.append('customerAccess', customerAccess.toString());
            formData.append('isActive', isActive.toString());
            formData.append('displayName', displayName);
            formData.append('name', name);
            formData.append('documentCategory', documentCategory);
            formData.append('documentType', documentType);
            formData.append('doctype', doctype);
            formData.append('images', imageData, { filename: path.basename(imagePath) });

            // Send Axios request
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };


            const response = await axios.post(`${serverAPIURL}/documents/document/`, formData, {
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

async function getToken(serverAPIURL, email, password) {
    try {
        const tokenResponse = await axios.post(`${serverAPIURL}/security/getToken`, { email, password });
        const { accessToken, userId, sessionId } = tokenResponse.data;
        return { token: accessToken, userId, sessionId };
    } catch (error) {
        console.error('Error fetching token:', error);
        throw error;
    }
}

async function checkFileExistenceByETag(etagValue) {
    const url = `${serverAPIURL}/documents/checkFileExistenceByETag`;
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


async function attachDrawingToMachine(payLoad) {
    const url = `${serverAPIURL}/products/drawings`;
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






main();