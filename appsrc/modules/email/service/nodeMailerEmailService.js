const nodemailer = require('nodemailer');
const logger = require('../../config/logger');

class NodeMailerEmailService {

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.NODE_MAILER_HOST,
            port: process.env.NODE_MAILER_PORT,
            ignoreTLS: true,
            secure: false
        })
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

}


module.exports = new NodeMailerEmailService();