const ObjectId = require('mongoose').Types.ObjectId;
var async = require("async");
const { Config } = require('../../config/models');
const { emailController } = require('../controllers');
const { simpleEmailService } = require('../../../configs/aws/ses');
const logger = require('../../config/logger');

class EmailService {

    constructor() {}

    async sendEmail( req ){
        try {
            const params = req.body;
            // ADDING THE USER PARAMETER DETAILS FOR LOG
            if(req.body.toUser && ObjectId.isValid(req.body.toUser._id)) {
                req.body.toUsers = [req.body.toUser._id];
                if(req.body.toUser.customer && ObjectId.isValid(req.body.toUser.customer._id)) {
                    req.body.customer = req.body.toUser.customer._id;
                }
                if(req.body.toUser.contact && ObjectId.isValid(req.body.toUser.contact._id)) {
                    req.body.toContacts = [req.body.toUser.contact._id];
                }
            }

            // EMAIL NOTIFICATIONS OFF
            const isNotificationsDisabled = String( process.env.EMAIL_NOTIFICATIONS_DISABLED )?.toLowerCase() === 'true';
        
            if ( isNotificationsDisabled ) {
                throw new Error('Email service is turned off.');
            }

            // OVERRIDE EMAILS ADDRESS
            const overrideEmail = process.env.NOTIFY_RECEIVER_EMAIL?.split(',')
            .map(email => email.trim().toLowerCase()).filter(Boolean);
            if (overrideEmail?.length) {
                params.toEmails = overrideEmail;
                delete params?.ccEmails;
                delete params?.bccEmails;
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
            await simpleEmailService( params );
            await emailController.newEmailLog( req );
        } catch (error) {
            logger.error(new Error(`Failed to send email: ${error}`));
            throw new Error('Email sending failed');
        }
    };


}


module.exports = EmailService;