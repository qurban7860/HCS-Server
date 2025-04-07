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
        const result = await dbService.postObject(getDocFromReq(req, 'new'));
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
        const mongoUri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWD}@${process.env.MONGODB_HOST}/${process.env.MONGODB_NAME}`;
        // const mongoUri = `mongodb://localhost:27017/${process.env.MONGODB_NAME}`;
        await execCommand(`mongodump --out ${S3_BUCKET} ${collections ? `--collection ${collections}` : ''} --uri="${mongoUri}"`);
        const fileName = `db-${timestamp}`;
        var zipFileName = `db-${timestamp}.zip`;
        const zipPath = `./${S3_BUCKET}/${zipFileName}`;
        const backupLocation = `./${S3_BUCKET}/${process.env.MONGODB_NAME}`;
        const zipSizeKb = await zipFolder(backupLocation, zipPath);
        if (zipSizeKb > 0) {
            await uploadToS3(zipPath, fileName, S3_BUCKET);
            const endTime = performance.now();
            var endDateTime = fDateTime(new Date());
            var durationSeconds = (endTime - startTime) / 1000;
            let req = {};
            req.body = {};
            // BACKUP SIZE IN MB
            var backupSize = zipSizeKb > 0 ? zipSizeKb / 1024 : 0
            req.body = {
                name: zipFileName,
                backupDuration: durationSeconds,
                backupMethod: 'mongodump',
                backupLocation: `${S3_BUCKET}/${zipFileName}`,
                backupStatus: '201',
                databaseVersion: '1',
                databaseName: process.env.MONGODB_USERNAME,
                backupType: 'SYSTEM',
                backupSize,
                backupTime: endDateTime
            };
            const DBbackupData = await postBackup(req);
            req.body.dbBackup = DBbackupData?._id;
            req.body.backupSize = `${backupSize?.toFixed(2) || 0} MB`
            req.body.backupStatus = "completed"
            await emailService.sendDbBackupEmail(req);
            await cleanUp(`./${S3_BUCKET}`);
        } else {
            throw new Error('Zip file is empty');
        }
    } catch (error) {
        const endDateTime = fDateTime(new Date());
        req.body = {
            name: zipFileName,
            backupDuration: durationSeconds,
            backupMethod: 'mongodump',
            backupLocation: `${s3BackupLocation}/${zipFileName}`,
            backupStatus: "500",
            databaseVersion: '1',
            databaseName: process.env.MONGODB_USERNAME,
            backupType: 'SYSTEM',
            backupSize,
            backupTime: endDateTime
        };
        await postBackup(req);
        req.body.backupStatus = "failed"
        req.body.backupSize = `${backupSize?.toFixed(2) || 0} MB`
        req.body.error = `<strong>Error:</strong> ${error?.message}<br>`
        await emailService.sendDbBackupEmail(req);
        logger.error(`DB backup failed : , ${error}`);
    }
};

const execCommand = (cmd) => new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => (err ? reject(stderr || err.message) : resolve(stdout)));
});

const zipFolder = (sourceDirectory, filePath) => {
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

const uploadToS3 = async (filePath, fileName, folder) => {
    try {
        const fileContent = fs.readFileSync(filePath);
        await uploadFileS3(fileName, folder, fileContent, "zip", true)
    } catch (err) {
        logger.error(`Failed to uploadToS3 archive: ${err}`);
        throw new Error(err)
    }
}
exports.uploadToS3 = uploadToS3;

const cleanUp = async (path) => {
    try {
        await fs.rm(path, { recursive: true, force: true })
        logger.info(`Successfully removed ${path}`);
    } catch (e) {
        logger.error(`Failed to remove ${path}: ${e}`)
        throw new Error(e)
    }
}


exports.cleanUp = cleanUp;

function getDocFromReq(req, type) {
    const fields = [
        'name', 'backupSize', 'backupType', 'databaseName',
        'databaseVersion', 'backupStatus', 'backupLocation',
        'backupMethod', 'backupDuration', 'isActive', 'isArchived',
    ];
    const doc = type == 'new' ? new Backup() : {};

    fields.forEach((field) => {
        if (req.body?.[field]) doc[field] = req.body[field];
    });

    return doc;
}

exports.dbBackup = dbBackup;