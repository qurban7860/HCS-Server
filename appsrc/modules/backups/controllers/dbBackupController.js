const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const logger = require('../../config/logger');
const BackupDBService = require('../service/backupDBService');
const EmailService = require('../service/emailService');
const { uploadFileS3 } = require('../../../base/aws');
const { Backup } = require('../models');
const AWS = require('aws-sdk');
const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs');
const archiver = require('archiver');
const { fDateTime } = require('../../../../utils/formatTime');

AWS.config.update({ region: process.env.WS_REGION });
const s3 = new AWS.S3();

const dbService = new BackupDBService();
const emailService = new EmailService();

const CRON_TIME = process.env.DB_CRON_TIME?.trim();
const S3_BUCKET = process.env.DB_BACKUP_S3_BUCKET?.trim();
const ENABLE_CRON = process.env.DB_CRON_JOB === 'true';

if (CRON_TIME && ENABLE_CRON && S3_BUCKET) {
    cron.schedule(CRON_TIME, async () => {
        try {
            await dbBackup();
        } catch (error) {
            logger.error(`Error running DB backup : , {error}`);
        }
    });
    logger.info(`Cron job scheduled: ${CRON_TIME}`);
} else {
    logger.error('Cron job not scheduled: Invalid configuration');
}

exports.getBackup = async (req, res) => {
    try {
        const backup = await dbService.getObjectById(Backup, {}, req.params.id, [
            { path: 'createdBy', select: 'name' },
            { path: 'updatedBy', select: 'name' },
        ]);
        res.json(backup);
    } catch (error) {
        logger.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    }
};

exports.getBackups = async (req, res) => {
    try {
        const query = req.query || {};
        const orderBy = query.orderBy || { createdAt: -1 };
        delete query.orderBy;

        const backups = await dbService.getObjectList(req, Backup, {}, query, orderBy, [
            { path: 'createdBy', select: 'name' },
            { path: 'updatedBy', select: 'name' },
        ]);
        res.json(backups);
    } catch (error) {
        logger.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    }
};

const postBackup = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    }
    try {
        await dbService.postObject(getDocFromReq(req, 'new'));
    } catch (error) {
        logger.error(error);
        throw new Error(error)
    }
};

exports.postBackup = postBackup;

const dbBackup = async () => {
    try {
        const startTime = performance.now();
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, -5);
        const collections = process.env.DB_BACKUP_COLLECTIONS?.trim();
        // const mongoUri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWD}@${process.env.MONGODB_HOST}/${process.env.MONGODB_NAME}`;
        const mongoUri = "mongodb://127.0.0.1:27017/howick"
        await execCommand(`mongodump --out ${S3_BUCKET} ${collections ? `--collection ${collections}` : ''} --uri="${mongoUri}"`);
        const S3Path = 'FRAMA-DB';
        const fileName = `db-${timestamp}.zip`;
        const zipPath = `./${S3_BUCKET}/${fileName}`;
        const zipFilePath = `./${S3_BUCKET}/${process.env.MONGODB_NAME}`;
        const zipSizeKb = await zipFolder(zipFilePath, zipPath);
        console.log(" zipSizeKb : ", zipSizeKb)
        if (zipSizeKb > 0) {
            console.log("Before Upload")
            await uploadToS3(zipFilePath, fileName,);
            console.log("After Upload")
            // await cleanUp([S3_BUCKET, zipPath]);
            const endTime = performance.now();
            const endDateTime = fDateTime(new Date());
            const durationSeconds = (endTime - startTime) / 1000;
            let req = {};
            req.body = {};
            const backupsizeInGb = zipSizeKb > 0 ? zipSizeKb / (1024 * 1024) : 0
            req.body = {
                name: fileName,
                backupDuration: durationSeconds,
                backupMethod: 'mongodump',
                backupLocation: `${S3Path}/${fileName}`,
                backupStatus: '201',
                databaseVersion: '1',
                databaseName: process.env.MONGODB_USERNAME,
                backupType: 'SYSTEM',
                backupSize: `${parseFloat(backupsizeInGb.toFixed(4)) || 0} GB`,
                backupTime: endDateTime
            };
            console.log("Before Post")
            await postBackup(req);
            console.log("After Post")
            console.log("Before Email")
            await emailService.sendDbBackupEmail(req);
            console.log("After Email")
        } else {
            throw new Error('Zip file is empty');
        }
    } catch (error) {
        logger.error(`DB backup failed : , ${error}`);
    }
};

const execCommand = (cmd) => new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => (err ? reject(stderr || err.message) : resolve(stdout)));
});

const zipFolder = (sourceDirectory, filePath) => {
    console.log("sourceDirectory, filePath : ", sourceDirectory, filePath)
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(filePath);
        const archive = archiver('zip', { zlib: { level: 9 } }); // Max compression
        let totalBytes = 0;

        output.on('close', () => {
            logger.info(`Archive created successfully: ${filePath}`);
            resolve(totalBytes / 1024); // Return size in KB
        });

        archive.on('error', (err) => {
            logger.error(`Archiving error: ${err}`);
            reject(err);
        });

        archive.on('data', (data) => {
            totalBytes += data.length;
        });

        archive.pipe(output);
        archive.directory(sourceDirectory, false);

        archive.finalize().catch((err) => {
            logger.error(`Failed to finalize archive: ${err}`);
            reject(err);
        });
    });
};

async function uploadToS3(filePath, fileName, folder) {
    try {
        console.log("filePath : ", filePath)
        // const fileData = await fs.readFileSync(filePath);
        await uploadFileS3(fileName, folder, filePath, "zip")
    } catch (err) {
        logger.error(`Failed to uploadToS3 archive: ${err}`);
        throw new Error(err)
    }
}

const cleanUp = (paths) =>
    Promise.all(paths.map((path) =>
        fs.rm(path, { recursive: true, force: true })
            .catch((err) => logger.error(`Failed to remove ${path}: ${err}`))
    ));

function getDocFromReq(req, type) {
    const fields = [
        'name', 'backupSize', 'backupType', 'databaseName',
        'databaseVersion', 'backupStatus', 'backupLocation',
        'backupMethod', 'backupDuration', 'isActive', 'isArchived',
    ];
    const doc = type === 'new' ? new Backup() : {};

    fields.forEach((field) => {
        if (req.body?.[field]) doc[field] = req.body[field];
    });

    return doc;
}

exports.dbBackup = dbBackup;