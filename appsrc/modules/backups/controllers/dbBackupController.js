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
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, -5);
        const collections = process.env.DB_BACKUP_COLLECTIONS?.trim();
        const mongoUri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWD}@${process.env.MONGODB_HOST}/${process.env.MONGODB_NAME}`;
        // const mongoUri = "mongodb://127.0.0.1:27017/howick"
        await execCommand(`mongodump --out ${S3_BUCKET} ${collections ? `--collection ${collections}` : ''} --uri="${mongoUri}"`);

        const fileName = `db-${timestamp}.zip`;
        const zipPath = `./${S3_BUCKET}/${fileName}`;
        const zipSizeKb = await zipFolder(S3_BUCKET, zipPath);
        console.log(" zipSizeKb : ", zipSizeKb)
        if (zipSizeKb > 0) {
            await uploadToS3(zipPath, fileName, 'FRAMA-DB');
            // await cleanUp([S3_BUCKET, zipPath]);
            const endTime = performance.now();
            const endDateTime = fDateTime(new Date());
            const durationSeconds = (endTime - startTime) / 1000;
            let req = {};
            req.body = {};
            const backupsizeInGb = totalZipSizeInkb > 0 ? totalZipSizeInkb / (1024 * 1024) : 0
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
            await postBackup(req);
            await emailService.sendDbBackupEmail(req);
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

const zipFolder = (source, out) => new Promise((resolve, reject) => {
    const output = fs.createWriteStream(out);
    const archive = archiver('zip');
    let totalBytes = 0;

    archive.on('error', reject);
    archive.on('data', (data) => (totalBytes += data.length));
    output.on('close', () => resolve(totalBytes / 1024));

    archive.pipe(output);
    archive.directory(source, false);
    archive.finalize();
});

async function uploadToS3(filePath, fileName, folder) {
    try {
        const fileData = fs.readFileSync(filePath);
        await uploadFileS3(fileName, folder, fileData)
    } catch (err) {
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