const AWS = require('aws-sdk');
const logger = require('../../modules/config/logger');
const { emailDataComposer, rawEmailDataComposer, structureEmail, structureRawEmail } = require('../../modules/email/utils/');


const simpleEmailService = async (emailParams) => {
    try {
        const email = new AWS.SES({ region: process.env.AWS_REGION });
        if (emailParams?.attachments) {
            const rawParams = await structureRawEmail(emailParams);
            const Data = await rawEmailDataComposer(rawParams);
            return await email.sendRawEmail({ RawMessage: { Data } }).promise();
        }
        const params = await structureEmail(emailParams);
        await email.sendEmail(params).promise();

    } catch (error) {
        logger.error(new Error(`Email sending failed: ${error}`));
        throw new Error(error);
    }
};


module.exports = {
    simpleEmailService
}