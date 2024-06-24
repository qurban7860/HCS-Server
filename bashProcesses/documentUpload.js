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

//const serverURL = 'http://localhost:5002/api/1.0.0'; // Localhost Environment
const serverURL = 'https://dev.portal.server.howickltd.com/api/1.0.0'; // DEV Environment

const email = "a.hassan@terminustech.com";
const password = "24351172";
const whereToGenerateCSV = "../"; // where to generate CSV files!
//const machineDataDirectory = '/Users/naveed/software/howick/jobs-data'; // Change this to the root folder you want to start from
const machineDataDirectory = 'N:/Documentation/Job Data';
//const machineDataDirectory = '../Jobs Data';

const specificMchinesOnly = [ ];
const fromSerialNo = 15011;
const toSerialNo = 15015;
const targetDirectories = [ 'Assembly Drawings'];
const excludeDirectories = [ 'Archive', 'Fabricated Parts' ];
const allowedExtension = ['.pdf']; // Array of allowed files
const disallowedExtension = []; // Array of disallowed files

const consoleLog = false;

let token = null;
let userId;
let sessionId;
let machineDirectoriesData = [];
let filesData = [];
const csvFileName = fTimestamp(new Date())?.toString();
const mongoose__ = require('../appsrc/modules/db/dbConnection');
let indexing = 1

// ----------------------------------------------------------------

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
    if(machineDirectoriesData?.some( (m ) => m._id )){
        await getMachineSubFoldersData()
        // console.log("machineDirectoriesData with SubFoldersData : ",machineDirectoriesData)
        
        await checkFilesProperties()
        indexing = 1;
        
        //await uploadDocuments()
        
        await generateCSVonSuccess();
        // console.log("filesData : ",filesData)
    } else {
        console.log('Machines does not exist! Please add them.');
        process.exit(0)
    }
}

// ----------------------------------------------------------------

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

// ----------------------------------------------------------------

function fetchMachineSerialNo(inputString) {
    // Regular expression to match the number before the hyphen
    const machineSerialNoRegex = /^(\d+)\s-\s/;  
    const match = inputString.match(machineSerialNoRegex);
    return match ? match[1] : '';
}

// ----------------------------------------------------------------

async function getMachinesSerialNo() {
    try {
        console.log('\n---------------------- getMachinesSerialNo -------------------------\n');
        const folders = await readdir(machineDataDirectory);
        let count = 0;
        for (const folder of folders) {

            try {
                let productObject = null;
                let machineObject
                const serialNumber = await fetchMachineSerialNo(folder)
                if (serialNumber?.trim()) {
                    if ((fromSerialNo == 0 || serialNumber >=  fromSerialNo ) && (toSerialNo == 0 || serialNumber <=  toSerialNo )){
                        productObject = await Product.findOne({ 
                            serialNo: serialNumber.trim(), 
                        }).select('_id serialNo status').populate([ {path: 'status', select: '_id name slug'} ]).lean();
                        if( productObject?.status?.slug !== "transferred" ){
                            machineObject = {
                                _id: productObject?._id || null,
                                serialNo: serialNumber || '',
                                mainFolder: folder || '',
                            }
                            machineDirectoriesData.push( machineObject )
                        }
                    }else{
                        // console.log(`   SerialNo: ${serialNumber} not in range ${fromSerialNo} - ${toSerialNo}`);
                    }
                    
                }
            } catch (err) {
                console.error('Error while feching machine SerialNo :', err);
            }
        }
    } catch (e) {
            console.error('Error reading directory:', e);
    }
}

// ----------------------------------------------------------------

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

// ----------------------------------------------------------------

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

// ----------------------------------------------------------------
async function postDocumentType(categoryID, categoryName, docTypeName ){
    try{
        const url = `${serverURL}/documents/documentType`;
        const params = { 
            docCategory: categoryID,
            name: docTypeName,
            isActive: true,
            isArchived: false,
            customerAccess: true,
        }
        console.log(`   Creating new document type: ${categoryName} --> ${docTypeName} `)
        const newDocType = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(params)
        });
        return newDocType;
    } catch(e){
        console.log("Error while creating document type : ",e);
    }
}

async function fetchDocxType( docTypeName, categoryID  ) {
    if (docTypeName && docTypeName.trim().length > 0) {
        const response = await DocumentType.findOne({
            // name: { $regex: new RegExp( docTypeName.trim(), 'i') },
            // new RegExp(`^${emailVariable}$`, 'i') 
            name: { $regex: new RegExp( `^${docTypeName.trim()}$`, 'i') },
            isActive: true,
            isArchived: false,
            docCategory: categoryID
        }).select('_id name').lean();
        if(response?._id){
            return response;
        } else {
            return null;
        }
    } else {
        console.log(`   Document Type ${docTypeName} not found!`);
        return null;
    }
}

// ----------------------------------------------------------------

function fetchReferenceNumber(fileName) {
    let regex_ = /^(\w+)\s([\w\s]+)/;
    let matches = fileName.match(regex_);
    let referenceNumber
    if(matches){
        referenceNumber = matches[1].trim(); 
    }
    return matches ? referenceNumber : '';
}

// ----------------------------------------------------------------

function validateStockNoValue(stockNoValue){
    
    // /[^A-Z][^a-z][^0-9]/;
    //[a-zA-Z0-9]+
    //\w, \W: ANY ONE word/non-word character. For ASCII, word characters are [a-zA-Z0-9_]
    let ignoreList = ['REVISION', 'NOTES', 'FINISH', 'DRAWN BY', 'DRAWN', 'APPROVED', 'Mass', 'Dwg. No.', 'info@howick.co.nz', 'Hermanus'];
    const regex_ = /\W+/ ;
    if (stockNoValue){
        if (stockNoValue.length <= 2 || ignoreList.indexOf(stockNoValue) >= 0)
            return false;
        let matches = stockNoValue.match(regex_);
        if (matches){
            return false;
        }
        return true;
    }
    return false;
    
}

// ----------------------------------------------------------------

async function extractStockNo(pdfPath) {
    try {
        const fileExtension = path.extname(pdfPath);
        if( fileExtension?.toLowerCase() === '.pdf' ) {
            const dataBuffer = await fs.promises.readFile(pdfPath);
            const data = await PDFParser(dataBuffer);
            const pdfText = data.text;
            const lines = pdfText.split('\n');
            let stockNoValue = null;
            //console.log(pdfPath);
            let firstIndex = lines.indexOf('STOCK NO.');
            let lastIndex = lines.lastIndexOf('STOCK NO.');
            let stocknoFound = false;
            if (lastIndex >= 0){
                stockNoValue = lines[lastIndex + 1]?.trim();
                if (consoleLog) console.log('   lastIndex -->', lastIndex, ':', stockNoValue);

                if (stockNoValue == ('A3')) {
                    stockNoValue = lines[lastIndex + 10]?.trim();
                    if (consoleLog) console.log('   lastIndex + 10 -->', lastIndex, ':', stockNoValue);
                }
                
                if (stockNoValue?.includes('info@howick.co.nz')) {
                    stockNoValue = lines[lastIndex - 2]?.trim();
                    if (consoleLog) console.log('   lastIndex - 2 -->', lastIndex, stockNoValue);
                }
                if (stockNoValue == ('A3')) {
                    stockNoValue = lines[lastIndex - 3]?.trim();
                    if (consoleLog) console.log('   lastIndex - 3 -->', lastIndex, ':', stockNoValue);

                    if (!validateStockNoValue(stockNoValue)){
                        stockNoValue = lines[lastIndex + 10]?.trim();
                        if (consoleLog) console.log('   lastIndex + 10 -->', lastIndex, ':', stockNoValue);
                    }
                }
                if (stockNoValue?.includes('Mass')) {
                    stockNoValue = lines[firstIndex + 1]?.trim();
                    if (consoleLog) console.log('   firstIndex + 1 -->', stockNoValue);
                }
                if (stockNoValue?.includes('APPROVED')) {
                    stockNoValue = lines[firstIndex - 2]?.trim();
                    if (consoleLog) console.log('   firstIndex - 2 -->', firstIndex, stockNoValue);
                }
                if (stockNoValue?.includes('REVISION') || stockNoValue?.includes('NOTES') ) {
                    stockNoValue = lines[lastIndex - 1]?.trim();
                    if (consoleLog) console.log('   lastIndex - 1  -->', stockNoValue);
                    if (stockNoValue?.includes('REVISION') || stockNoValue?.includes('NOTES') ) {
                        stockNoValue = lines[firstIndex - 1]?.trim();
                        if (consoleLog) console.log('   firstIndex - 1  -->', stockNoValue);
                    }
                }
                if (stockNoValue?.includes('Dwg. No.')) {
                    stockNoValue = lines[lastIndex - 2]?.trim();
                    if (consoleLog) console.log('   lastIndex - 2 -->', lastIndex, ':', stockNoValue);
                    if (stockNoValue?.startsWith('Ph:')) {
                        stockNoValue = lines[lastIndex + 1]?.trim();
                        if (consoleLog) console.log('   lastIndex + 1 -->', stockNoValue);
                    }
                }
                if (stockNoValue.startsWith('DRAWN') ) {
                    stockNoValue = lines[firstIndex - 2]?.trim();
                }
                if (stockNoValue?.startsWith('1:')) {
                    stockNoValue = lines[firstIndex + 3]?.trim();
                    if (consoleLog) console.log('   firstIndex + 3 -->', stockNoValue);
                }
                
                if (stockNoValue?.length == 0 ||  stockNoValue?.length > 10){
                    stockNoValue = lines[lastIndex + 11]?.trim();
                    if (consoleLog) console.log('   lastIndex + 11 -->', lastIndex, ':', stockNoValue);
                }
                if (stockNoValue?.indexOf("/") >= 0){
                    stockNoValue = lines[lastIndex + 8]?.trim();
                    if (consoleLog) console.log('   lastIndex + 8 -->', lastIndex, ':', stockNoValue);
                }

                if (stockNoValue?.indexOf("No. OFF") >= 0){
                    stockNoValue = lines[lastIndex - 12]?.trim();
                    if (consoleLog) console.log('   lastIndex - 12 -->', lastIndex, ':', stockNoValue);
                }

                if (stockNoValue == 'FINISH') {
                    stockNoValue = lines[lastIndex - 1]?.trim();
                    if (consoleLog) console.log('   lastIndex - 1 -->', lastIndex, ':', stockNoValue);
                    if (!validateStockNoValue(stockNoValue)){
                        stockNoValue = lines[lastIndex - 3]?.trim();
                        if (consoleLog) console.log('   lastIndex - 3 -->', lastIndex, ':', stockNoValue);
                    }
                }

                if (!validateStockNoValue(stockNoValue)){
                    stockNoValue = lines[lastIndex - 3]?.trim();
                    if (consoleLog) console.log('   lastIndex - 3 -->', stockNoValue);
                }

                if (!validateStockNoValue(stockNoValue)){
                    stockNoValue = lines[firstIndex + 1]?.trim();
                    if (consoleLog) console.log('   firstIndex + 1 -->', stockNoValue);
                    if (stockNoValue?.includes('REVISION') || stockNoValue?.includes('NOTES') ) {
                        stockNoValue = lines[firstIndex - 1]?.trim();
                        if (consoleLog) console.log('   firstIndex - 1  -->', stockNoValue);
                    }
                }

                if (!validateStockNoValue(stockNoValue)){
                    stockNoValue = lines[lastIndex - 12]?.trim();
                    if (consoleLog) console.log('   lastIndex - 12 -->', stockNoValue);
                }

                if (consoleLog) console.log('   -----', stockNoValue, validateStockNoValue(stockNoValue));
            }
    
            return validateStockNoValue(stockNoValue) ? stockNoValue : '';
        } else {
            return '';
        }
    } catch (err) {
        console.error('Error extracting stock number from PDF : ', err);
        return "";
    }
}

// ----------------------------------------------------------------

async function fetchVersionNumber(fileName) {
    const regex_VersionNo = /V(\d+)\.pdf$/;
    const matches_Version = fileName.match(regex_VersionNo);
    const versionNumber = matches_Version ? matches_Version[1] : 1;
    return versionNumber ? versionNumber : '' ;
}

// ----------------------------------------------------------------

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

// ----------------------------------------------------------------

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

// ----------------------------------------------------------------

async function getMachineSubFoldersData( ) {
    try {
        console.log('------------ getMachineSubFoldersData -------------------------\n');
        if(Array.isArray(specificMchinesOnly) && specificMchinesOnly?.length > 0 ){
            machineDirectoriesData = machineDirectoriesData?.filter(md => 
                specificMchinesOnly?.some(sM =>  sM?.trim()?.toLowerCase() === md?.serialNo?.trim()?.toLowerCase()))
        }
        for (const [index, mData] of machineDirectoriesData.entries()) {
            await processMachineData( index, mData );
        }
    } catch (e) {
        console.error('Error reading directory:', e);
    }
}

// ----------------------------------------------------------------

async function processMachineData( index, mData) {
    let subFolders = await fs.promises.readdir(`${machineDataDirectory}/${mData?.mainFolder || ''}`);
    subFolders = await filterSubFolders( subFolders );

    if (!machineDirectoriesData[index].filesToUpload && Array.isArray(subFolders) && subFolders.length > 0) {
        machineDirectoriesData[index].filesToUpload = [];
        await processSubFolders( index, mData, subFolders );
    }
}

// ----------------------------------------------------------------

function filterSubFolders( subFolders ) {
    return subFolders?.filter(sb => {
        const includesTarget = targetDirectories?.some(el => sb?.toLowerCase()?.includes(el?.trim()?.toLowerCase()));
        const excludesTarget = excludeDirectories?.some(el => sb?.toLowerCase()?.includes(el?.trim()?.toLowerCase()));
        return includesTarget && !excludesTarget;
    });
}

// ----------------------------------------------------------------

async function processSubFolders( index, mData, subFolders ) {
    for (const subFolder of subFolders) {
        try {
            
            const fileExtension = path.extname(subFolder);
            if (fileExtension.length == 0 || isFileAllowed(fileExtension)) {
                const filesToUpload = [];
                const files = await fs.promises.readdir(`${machineDataDirectory}/${mData?.mainFolder}/${subFolder}`);
                const docCategory = await fetchDocxCategory(subFolder);
                await processFiles( files, filesToUpload, mData, subFolder, docCategory );
                // console.log('filesToUpload : ',filesToUpload);
                machineDirectoriesData[index].filesToUpload = filesToUpload;
            }else{
                console.log(`${machineDataDirectory}/${mData?.mainFolder}/${subFolder} -- ignored`);
            }
        } catch (err) {
            console.error('Error while fetching machine Sub Folder:', err);
        }
    }
}

// ----------------------------------------------------------------

async function processFiles(files, filesToUpload, mData, subFolder, docCategory ) {
    for (const file of files) {
        const fileExtension = path.extname(file);
        if (isFileAllowed(fileExtension)) {
            const fileData = await createFileData(file, mData, subFolder, docCategory);
            filesToUpload.push(fileData);
        }
    }
}

// ----------------------------------------------------------------

function isFileAllowed( fileExtension ) {
    return allowedExtension?.some(ext => fileExtension?.toLowerCase()?.includes(ext.toLowerCase())) &&
            !disallowedExtension?.some(ext => fileExtension?.toLowerCase()?.includes(ext.toLowerCase()));
}

// ----------------------------------------------------------------

async function createFileData(file, mData, subFolder, docCategory) {
    console.log(`${indexing} ${mData.serialNo}:: ${subFolder}/${file}`);   
    indexing += 1;
    const extension = path.extname(file);
    const filePath = `${mData?.mainFolder}/${subFolder}/${file}`;
    const fileName = file?.slice(0, -extension.length);
    const docEtag = await generateEtag(`${machineDataDirectory}/${filePath}`);
    let isDocumentId = null;
    const isETagExist = await checkFileExistenceByETag([docEtag]);
    if (isETagExist[0]?.documentFiles) {
        searchedObject = await isETagExist.flatMap(item => item.documentFiles).find(file => file?.eTag?.toString() === docEtag.toString());
        isDocumentId = searchedObject?.document;
    }
    let docxType = await fetchDocType(file);
    if (docxType) docxType = docxType.trim(); 
    if (docxType == 'FRAMA') docxType = "Assembly Drawings";
    if (docxType == 'Covers') docxType = "Cover";
    if (docxType == 'Lip Roller Assembly') docxType = "Lip Roller";
    if (docxType == 'Swage Hole Punch Assembly') docxType = "Swage Hole Punch";
    if (docxType == 'Cut Off Assembly') docxType = "Cut Off";
    if (docxType == 'Full Pre Punch Assembly') docxType = "Full Pre Punch";
    if (docxType == 'Swage Assembly') docxType = "Swage";
    if (docxType == 'H600RollerAssembly') docxType = "Roller";
    if (docxType == 'RollerAssembly') docxType = "Roller";
    if (docxType == 'Roller Assembly') docxType = "Roller";
    
    
    // console.log(`   document type: ${docxType}`);
    if (docxType.length == 0) docxType='Misc';
    // console.log(`   document type: ${docxType}`);

    let docType = await fetchDocxType(docxType, docCategory?._id, );
    if(!docType && docxType.length > 0){
        const newdocxType = await postDocumentType(docCategory?._id, docCategory?.name, docxType )

        if(newdocxType?.status === 201 ){
            docType = await fetchDocxType(docxType, docCategory?._id, docxType);
        }
    }
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
        stockNo: await extractStockNo(`${machineDataDirectory}/${filePath}`),
        eTag: docEtag,
        isETagExist: isDocumentId ? true : false,
    };

    if (isDocumentId) {
        data.documentId = isDocumentId;
    }
    console.log(`   docCat: ${data.docCategoryName} docType: ${docxType} --> ${data.docTypeName} - ${data.docTypeId} refNo: ${data.referenceNumber} stockNo: ${data.stockNo} eTag: ${data.eTag} ${data.isETagExist} \n`);  

    return data;
}

// ----------------------------------------------------------------

async function checkFilesProperties(){
    console.log('------------ checkFilesProperties -------------------------\n');
    for (const machineData of machineDirectoriesData) {
        if(Array.isArray( machineData?.filesToUpload ) && machineData?.filesToUpload?.length > 0 ){
        for (const docData of machineData?.filesToUpload) {
            try{
                const data_log = await parsePDFAndLog(docData, machineData?.serialNo, machineData?._id);
                const messages = await checkKeyValues(data_log);
                // console.log("messages : ",messages)
                if (messages && messages?.length != 0) {
                    data_log.messages = messages;
                }
                filesData.push(data_log);
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
        eTag: obj?.eTag || '',
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

// ----------------------------------------------------------------

async function uploadDocuments() {
    try {
        console.log('\n---------------------- uploadDocuments -------------------------\n');
        for (const log of filesData) {
            log.isUploaded = false;
            if(!log?.messages || log?.isETagExist){
                if(!log?.isETagExist){
                    console.log(`${indexing} uploading ${log?.serialNo || '' }:: ${ log?.folderName || '' }/${log?.displayName || '' } `)
                    console.log(`   docCat: ${log?.documentCategoryName || '' } docType: ${log?.documentTypeName || '' } - ${log?.documentTypeId || '' } refNo: ${log?.referenceNumber || '' } stockNo: ${log?.stockNumber || '' } eTag: ${log?.eTag || '' } eTag Exist ? ${log?.isETagExist || '' }\n`); 
                    const response = await uploadDocument(log);
                    log.documentId = response?.data?.Document?._id;
                    log.isUploaded = true;
                } else {
                    const payload = {
                        "machine": log?.machineId,
                        "documentId": log?.documentId,
                        "isActive": true
                    }
                    const response = await attachDrawingToMachine(payload);
                    console.log(`${indexing} Attaching ${log?.serialNo || '' }:: ${ log?.folderName || '' }/${log?.displayName || '' }`)
                    console.log(`   docCat: ${log?.documentCategoryName || '' } docType: ${log?.documentTypeName || '' } - ${log?.documentTypeId || '' } refNo: ${log?.referenceNumber || '' } stockNo: ${log?.stockNumber || '' } eTag: ${log?.eTag || '' } eTag Exist ? ${log?.isETagExist || '' } Attach --> ${response}\n`);
                    if(response){
                        log.isMachineDrawingAttached = response;
                    }
                }
            } else {
                console.log(`${indexing} ${log?.serialNo || '' }:: ${ log?.folderName || '' }/${log?.displayName || '' }`)
                console.log(`   docCat: ${log?.documentCategoryName || '' } docType: ${log?.documentTypeName || '' } - ${log?.documentTypeId || '' } refNo: ${log?.referenceNumber || '' } stockNo: ${log?.stockNumber || '' } eTag: ${log?.eTag || '' } ${log?.isETagExist || '' } --> Properties ### ${log?.messages || ''} required!\n`);
            }
            indexing += 1;
        }
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
        const imageData = fs.readFileSync(`${machineDataDirectory}/${filePath}`);
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
        formData.append('images', imageData, { filename: path.basename(`${machineDataDirectory}/${filePath}`) } );
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
            return "Already Attached!";
        } else if(response?.status === 201 ){
            return "Yes";
        } else {
            return "No";
        }
    } catch (error) {
        console.error('Error while Attaching Machine Drawing :', error);
    }
}

// --------------------------------------------------------------

async function generateCSVonSuccess(){ 
    console.log('\n---------------------- generating CSV -------------------------\n');
    const reviseCSV = await filesData?.map(log => {
        delete log?.displayName;
        delete log?.eTag;
        return log;
    });
    const csv = await parse(reviseCSV);
    const fullPath = path.join(`${whereToGenerateCSV || '../' }${csvFileName}.csv`);
    await fs.writeFile(fullPath, csv, async (err) => {
        if (err) {
            console.error('Error appending to CSV file:', err);
            process.exit(0)
        }
        console.log(`Documents records appended to CSV file Name: ${csvFileName}.csv successfully.`);
        process.exit(0)
    });
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

// ----------------------------------------------------------------

main();