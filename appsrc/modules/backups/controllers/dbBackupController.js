const { validationResult } = require('express-validator');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const logger = require('../../config/logger');
const { fDateTime } = require('../../../../utils/formatTime');
const BackupDBService = require('../service/backupDBService');
const EmailService = require('../service/emailService');
const { Backup } = require('../models');
const AWS = require('aws-sdk');
const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs').promises;
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
            logger.error('Error running DB backup:', error);
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

exports.postBackup = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    }
    try {
        await dbService.postObject(getDocFromReq(req, 'new'));
        res.status(StatusCodes.CREATED).send('Backup recorded successfully');
    } catch (error) {
        logger.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    }
};

const dbBackup = async () => {
    try {
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, -5);
        const collections = process.env.DB_BACKUP_COLLECTIONS?.trim();
        const mongoUri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWD}@${process.env.MONGODB_HOST}/${process.env.MONGODB_NAME}`;

        await execCommand(`mongodump --out ${S3_BUCKET} ${collections ? `--collection ${collections}` : ''} --uri="${mongoUri}"`);

        const fileName = `db-${timestamp}.zip`;
        const zipPath = `./${fileName}`;
        const zipSizeKb = await zipFolder(S3_BUCKET, zipPath);

        if (zipSizeKb > 0) {
            await uploadToS3(zipPath, fileName, 'FRAMA-DB');
            await cleanUp([S3_BUCKET, zipPath]);
        } else {
            throw new Error('Zip file is empty');
        }
    } catch (error) {
        logger.error('DB backup failed:', error);
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

const uploadToS3 = async (filePath, key, folder) => {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) throw new Error('S3 bucket not defined');

    const fileContent = await fs.readFile(filePath);
    const params = { Bucket: bucket, Key: `${folder}/${key}`, Body: fileContent };
    const { Location } = await s3.upload(params).promise();

    logger.info(`Uploaded to S3: ${Location}`);
};

const cleanUp = (paths) => Promise.all(paths.map((path) => fs.rm(path, { recursive: true }).catch((err) => logger.error(`Failed to remove ${path}: ${err.message}`))));

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