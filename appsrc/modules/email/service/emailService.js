const ObjectId = require('mongoose').Types.ObjectId;
var async = require("async");
const nodemailer = require('nodemailer');
const { Config } = require('../../config/models');
const { emailController } = require('../controllers');
const { simpleEmailService } = require('../../../configs/aws/ses');
const logger = require('../../config/logger');

class EmailService {

    constructor() {
        this.transporter = process.env.ENV === 'local'
            ? nodemailer.createTransport({
                host: "localhost",
                port: 1025, // Default Maildev SMTP port
                ignoreTLS: true,
                secure: false
            })
            : null; // Will use AWS SES in production
    }

    async sendViaNodemailer(params) {
        try {
            const mailOptions = {
                from: params.fromEmail,
                to: Array.isArray(params.toEmails) ? params.toEmails.join(',') : params.toEmails,
                cc: params.ccEmails,
                bcc: params.bccEmails,
                subject: params.subject,
                html: params.htmlData,
                text: params.body
            };

            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            logger.error(new Error(`Failed to send email via Nodemailer: ${error}`));
            throw new Error('Email sending failed via Nodemailer');
        }
    }

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
            if (req.body.toUser && ObjectId.isValid(req.body.toUser._id)) {
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
            if (process.env.ENV === 'local') {
                await this.sendViaNodemailer(params);
            } else {
                await simpleEmailService(params);
                req.body.status = "SUBMITTED";
            }
            await emailController.newEmailLog(req);
        } catch (error) {
            req.body.status = "FAILED";
            await emailController.newEmailLog(req);
            logger.error(new Error(`Failed to send email: ${error}`));
            throw new Error('Email sending failed');
        }
    };
}


module.exports = EmailService;