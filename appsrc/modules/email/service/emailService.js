const ObjectId = require('mongoose').Types.ObjectId;
const { Config } = require('../../config/models');
const { emailController } = require('../controllers');
const { simpleEmailService } = require('../../../configs/aws/ses');
const logger = require('../../config/logger');
this.nodeMailerService = require('./nodeMailerEmailService');

class EmailService {

    async isEmailOn() {
        try {
            // EMAIL NOTIFICATIONS OFF
            const isNotificationsDisabled = String(process.env.EMAIL_NOTIFICATIONS_DISABLED)?.toLowerCase() === 'true';

            if (isNotificationsDisabled) {
                throw new Error('Email service is turned off.');
            }
        } catch (error) {
            logger.error(new Error(`Failed to send email: ${error}`));
            throw new Error('Email sending failed');
        }
    };

    async sendEmail(req) {
        const params = req.body;

        // OVERRIDE EMAILS ADDRESS
        const overrideEmail = process.env.NOTIFY_RECEIVER_EMAIL?.split(',')
            .map(email => email.trim().toLowerCase()).filter(Boolean);
        if (overrideEmail?.length) {
            params.toEmails = overrideEmail;
            delete params?.ccEmails;
            delete params?.bccEmails;
            req.body.toEmails = overrideEmail
        }

        // SOURCE EMAIL
        let sourceEmail = `"HOWICK LIMITED" <${process.env.AWS_SES_FROM_EMAIL}>`;

        const regex = /^COMPANY-NAME$/i;
        const configObject = await Config.findOne({
            name: regex,
            type: 'ADMIN-CONFIG',
            isArchived: false,
            isActive: true
        }).select('value');

        if (configObject?.value) {
            sourceEmail = configObject.value;
        }
        params.fromEmail = sourceEmail;
        req.body.fromEmail = sourceEmail;
        try {
            // ADDING THE USER PARAMETER DETAILS FOR LOG
            if (req.body?.toUser && ObjectId.isValid(req.body?.toUser?._id)) {
                req.body.toUsers = [req.body.toUser._id];
                if (req.body.toUser.customer && ObjectId.isValid(req.body.toUser.customer._id)) {
                    req.body.customer = req.body.toUser.customer._id;
                }
                if (req.body.toUser.contact && ObjectId.isValid(req.body.toUser.contact._id)) {
                    req.body.toContacts = [req.body.toUser.contact._id];
                }
            }

            // EMAIL NOTIFICATIONS OFF
            const isNotificationsDisabled = String(process.env.EMAIL_NOTIFICATIONS_DISABLED)?.toLowerCase() === 'true';

            if (isNotificationsDisabled) {
                throw new Error('Email service is turned off.');
            }

            // Use Maildev in development, AWS SES in production
            if (process.env.ENV === 'local' && process.env.NODE_MAILER_HOST) {
                await this.nodeMailerService.sendViaNodemailer(params);
            } else {
                await simpleEmailService(params);
                req.body.status = "SUBMITTED";
                await emailController.newEmailLog(req);
            }
        } catch (error) {
            console.log(" error : ", error)
            req.body.status = "FAILED";
            await emailController.newEmailLog(req);
            logger.error(new Error(`Failed to send email: ${error}`));
            throw new Error('Email sending failed');
        }
    };
}


module.exports = EmailService;