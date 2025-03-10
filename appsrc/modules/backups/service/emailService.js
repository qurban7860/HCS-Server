const { render } = require('template-file');
const fs = require('fs');
const path = require('path');
const { renderEmail } = require('../../email/utils');
const logger = require('../../config/logger');
const emailService = require('../../email/service/emailService');

class TicketEmailService {
    constructor() {
        this.email = new emailService();
    }

    sendDbBackupEmail = async (req) => {
        try {

            let subject = "Database Backup";
            const toEmails = process.env.DB_BACKUP_NOTIFY_TO?.trim();
            if (!toEmails) {
                logger.error("DB Backup Notify reciver emails not defined!");
                return
            }
            const {
                name,
                backupDuration,
                backupMethod,
                backupLocation,
                backupStatus,
                databaseVersion,
                databaseName,
                backupType,
                backupSize,
                backupTime,
            } = req.body;

            // Prepare Email Params
            let params = { toEmails, subject };

            // Read Email Template and Render
            const contentHTML = await fs.promises.readFile(path.join(__dirname, "../../email/templates/databaseBackup.html"), "utf8");
            const content = render(contentHTML, { backupTime, name, databaseName, backupSize, backupLocation });
            const htmlData = await renderEmail(subject, content);

            // Send Email
            params.htmlData = htmlData;
            req.body = { ...params };
            await this.email.sendEmail(req);
        } catch (error) {
            logger.error(new Error(error));
            throw error;
        }
    };

}


module.exports = TicketEmailService;
