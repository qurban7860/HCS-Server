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
const { fTimestamp } = require('../utils/formatTime');

const util = require('util');
const readdir = util.promisify(fs.readdir);

const serverURL = 'http://localhost:5002/api/1.0.0';
// const serverURL = 'http://dev.portal.server.howickltd.com/api/1.0.0'; // DEV Environment

const email = "a.hassan@terminustech.com";
const password = "24351172";
const machineDataDirectory = '../Jobs Data'; // Change this to the root folder you want to start from
const specificMchinesOnly = [];
let machineDataList = [];
const targetDirectories = [ 'Assembly Drawings'];
const excludeDirectories = [ 'Archive' ];
const allowedExtension = ['.pdf']; // Array of allowed files
const disallowedExtension = []; // Array of disallowed files

let token = null;
let userId;
let sessionId;
let logs = [];
const csvFileName = fTimestamp(new Date())?.toString();
const mongoose__ = require('../appsrc/modules/db/dbConnection');
let indexing = 1


async function main() {
    try {
        const authData = await getToken(serverURL, email, password);
        token = authData.token;
        userId = authData.userId;
        sessionId = authData.sessionId;
    } catch (error) {
        console.log(error);
    }
    await getMachinesSerialNo()
    if(machineDataList?.some( (m ) => m._id )){
        await getMachineSubFoldersData()
        // console.log("machineDataList with SubFoldersData : ",machineDataList)
        await checkFilesProperties()
        indexing = 1;
        await uploadDocuments()
        // console.log("logs : ",logs)

    } else {
        console.log('Machines does not exist! Please add them.');
        process.exit(0)
    }

}

async function getToken(serverURL, email, password) {
    try {
        const tokenResponse = await axios.post(`${serverURL}/security/getToken`, { email, password });
        const { accessToken, userId, sessionId } = tokenResponse.data;
        return { token: accessToken, userId, sessionId };
    } catch (error) {
        console.error('Login Error:', error);
        throw error;
    }
}


function fetchMachineSerialNo(inputString) {
    // Regular expression to match the number before the hyphen
    const machineSerialNoRegex = /^(\d+)\s-\s/;  
    const match = inputString.match(machineSerialNoRegex);
    return match ? match[1] : '';
}

async function getMachinesSerialNo() {
    try {
        const folders = await readdir(machineDataDirectory);
        for (const folder of folders) {
            try {
                let productObject = null;
                let machineObject
                const serialNumber = await fetchMachineSerialNo(folder)
                if (serialNumber?.trim()) {
                    productObject = await Product.findOne({ 
                        serialNo: serialNumber.trim(), 
                        'status.slug': { $not: { $regex: /^transferred$/i } }
                    }).select('_id serialNo status').populate([ {path: 'status', select: '_id name slug'} ]).lean();
                    console.log("productObject : ",productObject)
                    machineObject = {
                        _id: productObject?._id || null,
                        serialNo: serialNumber || '',
                        mainFolder: folder || '',
                    }
                    machineDataList.push( machineObject )
                }
            } catch (err) {
                console.error('Error while feching machine SerialNo :', err);
            }
        }
    } catch (e) {
            console.error('Error reading directory:', e);
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

function fetchDocType(fileName) {
    let regex_ = /^(\w+)\s([\w\s]+)/;
    let pattern = /\s*[vV]\s*\d+(\.\d+)?\s*$/;
    let matches = fileName.match(regex_);
    let docxType
    if(matches){
        docxType = matches[2].trim(); 
        if (pattern.test(docxType)) {
            docxType = docxType.replace(pattern, '');
        }
    }
    return matches ? docxType : '';
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
function fetchReferenceNumber(fileName) {
    let regex_ = /^(\w+)\s([\w\s]+)/;
    let matches = fileName.match(regex_);
    let referenceNumber
    if(matches){
        referenceNumber = matches[1].trim(); 
    }
    return matches ? referenceNumber : '';
}

async function extractStockNo(pdfPath) {
    try {
        const fileExtension = path.extname(pdfPath);
        if( fileExtension?.toLowerCase() === '.pdf' ) {
            const dataBuffer = await fs.promises.readFile(pdfPath);
            const data = await PDFParser(dataBuffer);
            const pdfText = data.text;
            const lines = pdfText.split('\n');
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
            return stockNoValue ? stockNoValue : '';
        } else {
            return '';
        }
    } catch (err) {
        console.error('Error extracting stock number from PDF:', err);
        return "";
    }
}

async function fetchVersionNumber(fileName) {
    const regex_VersionNo = /V(\d+)\.pdf$/;
    const matches_Version = fileName.match(regex_VersionNo);
    const versionNumber = matches_Version ? matches_Version[1] : 1;
    return versionNumber ? versionNumber : '' ;
}



async function generateEtag(data) {
    const crypto = require('crypto');
    const md5sum = crypto.createHash('md5');
    let stream;
    if (typeof data === 'string') {
        stream = fs.createReadStream(data);
    } else if (Buffer.isBuffer(data)) {
        stream = require('stream').Readable.from(data);
    } else {
        return Promise.reject(new Error('Invalid input. Please provide a file path or a buffer.'));
    }
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => { md5sum.update(chunk) });
        stream.on('end', () => {
            let etag = `"${md5sum.digest('hex')}"`;
            etag = etag.replace(/ /g, "").replace(/"/g, "");
            resolve(etag);
        });
        stream.on('error', (error) => { reject(error) });
    });
}

async function checkFileExistenceByETag(etagValue) {
    const url = `${serverURL}/documents/checkFileExistenceByETag`;
    try {
        const response = await axios.get(url, {
            params: { eTags: etagValue }, // etagValue is an array
            headers: { 'Content-Type': 'application/json',  'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error while checking E-Tag :', error);
    }
}


async function getMachineSubFoldersData( ) {
    try {
        if(Array.isArray(specificMchinesOnly) && specificMchinesOnly?.length > 0 ){
            machineDataList = machineDataList?.filter(md => 
                specificMchinesOnly?.some(sM =>  sM?.trim()?.toLowerCase() === md?.serialNo?.trim()?.toLowerCase()))
        }
        for (const [index, mData] of machineDataList.entries()) {
            await processMachineData( index, mData );
        }
    } catch (e) {
        console.error('Error reading directory:', e);
    }
}

async function processMachineData( index, mData) {
    let subFolders = await fs.promises.readdir(`${machineDataDirectory}/${mData?.mainFolder || ''}`);
    subFolders = await filterSubFolders( subFolders );

    if (!machineDataList[index].filesToUpload && Array.isArray(subFolders) && subFolders.length > 0) {
        machineDataList[index].filesToUpload = [];
        await processSubFolders( index, mData, subFolders );
    }
}

function filterSubFolders( subFolders ) {
    return subFolders?.filter(sb => {
        const includesTarget = targetDirectories?.some(el => sb?.toLowerCase()?.includes(el?.trim()?.toLowerCase()));
        const excludesTarget = excludeDirectories?.some(el => sb?.toLowerCase()?.includes(el?.trim()?.toLowerCase()));
        return includesTarget && !excludesTarget;
    });
}

async function processSubFolders( index, mData, subFolders ) {
    for (const subFolder of subFolders) {
        try {
            const filesToUpload = [];
            const files = await fs.promises.readdir(`${machineDataDirectory}/${mData?.mainFolder}/${subFolder}`);
            const docCategory = await fetchDocxCategory(subFolder);
            await processFiles( files, filesToUpload, mData, subFolder, docCategory );
            // console.log('filesToUpload : ',filesToUpload);
            machineDataList[index].filesToUpload = filesToUpload;
        } catch (err) {
            console.error('Error while fetching machine Sub Folder:', err);
        }
    }
}

async function processFiles(files, filesToUpload, mData, subFolder, docCategory ) {
    for (const file of files) {
        const fileExtension = path.extname(file);
        if (isFileAllowed(fileExtension)) {
            const fileData = await createFileData(file, mData, subFolder, docCategory);
            filesToUpload.push(fileData);
        }
    }
}

function isFileAllowed( fileExtension ) {
    return allowedExtension?.some(ext => fileExtension?.toLowerCase()?.includes(ext.toLowerCase())) &&
            !disallowedExtension?.some(ext => fileExtension?.toLowerCase()?.includes(ext.toLowerCase()));
}

async function createFileData(file, mData, subFolder, docCategory) {
    console.log(`${indexing} fetching data from ### ${file}`);   
    indexing += 1;
    const extension = path.extname(file);
    const filePath = `${machineDataDirectory}/${mData?.mainFolder}/${subFolder}/${file}`;
    const fileName = file?.slice(0, -extension.length);
    const docEtag = await generateEtag(filePath);
    let isDocumentId = null;
    const isETagExist = await checkFileExistenceByETag([docEtag]);
    if (isETagExist[0]?.documentFiles) {
        searchedObject = await isETagExist.flatMap(item => item.documentFiles).find(file => file?.eTag?.toString() === docEtag.toString());
        isDocumentId = searchedObject?.document;
    }
    const docxType = await fetchDocType(file);
    const docType = await fetchDocxType(docxType, docCategory?._id);
    const data = {
        filePath: filePath,
        fileName: fileName,
        extension: extension,
        category: subFolder,
        docCategoryId: docCategory?._id || '',
        docCategoryName: docCategory?.name || ( subFolder || '' ),
        docTypeId: docType?._id || '',
        docTypeName: docType?.name || ( docxType || ''),
        versionNumber: await fetchVersionNumber(file),
        referenceNumber: await fetchReferenceNumber(file),
        stockNo: await extractStockNo(filePath),
        eTag: docEtag,
        isETagExist: isDocumentId ? true : false,
    };

    if (isDocumentId) {
        data.documentId = isDocumentId;
    }

    return data;
}

async function checkFilesProperties(){
    for (const machineData of machineDataList) {
        if(Array.isArray( machineData?.filesToUpload ) && machineData?.filesToUpload?.length > 0 ){
        for (const docData of machineData?.filesToUpload) {
            try{
                const data_log = await parsePDFAndLog(docData, machineData?.serialNo, machineData?._id);
                const propertiesNotFound = await checkKeyValues(data_log);
                // console.log("propertiesNotFound : ",propertiesNotFound)
                if (propertiesNotFound && propertiesNotFound?.length != 0) {
                    data_log.propertiesNotFound = propertiesNotFound;
                }
                logs.push(data_log);
            } catch(e){
                console.error('Error while checking file properties:', e);
            }
        }
        }
    }
}

//----------------------------------------------------------------

async function parsePDFAndLog(obj, serialNo, machineId ) {
    let log = {
        folderName: obj?.category || '',
        serialNo: serialNo || '',
        machineId: machineId || null,
        documentCategoryName: obj?.docCategoryName || '',
        documentCategoryId: obj?.docCategoryId || null,
        documentTypeName: obj?.docTypeName || '',
        documentTypeId: obj?.docTypeId || null,
        displayName: obj?.fileName || '',
        versionNumber: obj?.versionNumber || '',
        referenceNumber: obj?.referenceNumber || '',
        stockNumber: obj?.stockNo || '',
        customerAccess: false,
        isActive: true,
        filePath: obj?.filePath || '',
        isETagExist: obj?.isETagExist || false,
        isMachineDrawingExist: obj?.isETagExist || false,
        isMachineDrawingAttached: false,
    };
    if(obj?.documentId){
        log.documentId = obj?.documentId
    }
    return log;
}
async function uploadDocuments() {
    try {
        for (const log of logs) {
            log.isUploaded = false;
            if(!log?.propertiesNotFound || log?.isETagExist){
                if(!log?.isETagExist){
                    console.log(`${indexing} uploading file ### ${log?.displayName || '' }`);   
                    const response = await uploadDocument(log);
                    log.documentId = response?.Document?._id || null;
                    log.isUploaded = true;
                } else {
                    const payload = {
                        "machine": log?.machineId,
                        "documentId": log?.documentId,
                        "isActive": true
                    }
                    const response = await attachDrawingToMachine(payload);
                    console.log(`${indexing} Attaching file ### ${log?.displayName || '' }`); 
                    console.log(response)
                    if(response){
                        log.isMachineDrawingAttached = response;
                    }
                }
            } else {
                console.log(`${indexing} Document file ### ${log?.displayName || '' } Properties ### ${log?.propertiesNotFound || ''} required!`);   
            }
            indexing += 1;
        }
        const csv = parse(logs);
        const fullPath = path.join('../', `${csvFileName}.csv`);
        await fs.writeFile(fullPath, csv, async (err) => {
            if (err) {
                console.error('Error appending to CSV file:', err);
                process.exit(0)
            }
            console.log(`Documents records appended to CSV file Name: ${csvFileName}.csv in project diractory successfully.`);
            process.exit(0)
        });
    } catch (error) {
        console.error('Error uploading documents:', error);
    }
}

//----------------------------------------------------------------

async function uploadDocument(data) {
    try {
        const { 
            machineId, 
            documentCategoryId,  
            documentTypeId, 
            displayName, 
            versionNumber, 
            referenceNumber, 
            stockNumber,
            customerAccess, 
            isActive, 
            filePath
        } = data;
        // Read the image file
        const imageData = fs.readFileSync(filePath);
        // Create form data
        const formData = new FormData();
        formData.append('drawingMachine', machineId?.toString());
        formData.append('customerAccess', customerAccess?.toString());
        formData.append('isActive', isActive?.toString());
        formData.append('displayName', displayName);
        formData.append('name', displayName);
        formData.append('documentCategory', documentCategoryId?.toString());
        formData.append('documentType', documentTypeId?.toString());
        formData.append('doctype', documentTypeId?.toString());
        formData.append('images', imageData, { filename: path.basename(filePath) } );
        if(referenceNumber){
            formData.append('referenceNumber', referenceNumber?.toString());
        }
        if(stockNumber){
            formData.append('stockNumber', stockNumber?.toString());
        }
        if(versionNumber){
            formData.append('versionNo', versionNumber?.toString());
        }


        const response = await axios.post(`${serverURL}/documents/document/`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });
        return response
        
    } catch (error) {
        console.error(`Error uploading document ${ data?.displayName || '' } :`, error);
    }
}

//----------------------------------------------------------------

async function attachDrawingToMachine(payLoad) {
    const url = `${serverURL}/products/drawings`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payLoad)
        });
        
        if(response?.status === 400 ) {
            return "Already Exists!";
        } else if(response?.status === 201 ){
            return "Yes";
        } else {
            return "No";
        }
    } catch (error) {
        console.error('Error while Attaching Machine Drawing :', error);
        return error
    }
}

//----------------------------------------------------------------

async function checkKeyValues(properties) {
    let emptyProperties = [];
    let result;
    const keys_Values = { ...properties };
    // Remove specific keys to Ignore
    delete keys_Values.isMachineDrawingAttached;
    delete keys_Values.uploadedSuccessfull;
    delete keys_Values.customerAccess;
    delete keys_Values.documentTypeName;
    delete keys_Values.isMachineDrawingExist;
    delete keys_Values.documentCategoryName;
    delete keys_Values.isETagExist;
    delete keys_Values.versionNumber;
    delete keys_Values.referenceNumber;
    delete keys_Values.stockNumber;
    delete keys_Values.documentId
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
            result = await result?.filter(Boolean);
        }
        return result;
    } else {
        return result = null;
    }
}


main();