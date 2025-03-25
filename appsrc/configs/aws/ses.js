const AWS = require('aws-sdk');
const logger = require('../../modules/config/logger');
const { emailDataComposer, structureEmailParams } = require('../../modules/email/utils/');


const simpleEmailService = async (emailParams) => {
    try {
        const email = new AWS.SES({ region: process.env.AWS_REGION });
        const params = await structureEmailParams(emailParams);
        if (params?.attachments) {
            const Data = await emailDataComposer(params);
            return await email.sendRawEmail({ RawMessage: { Data } }).promise();
        }
        await email.sendEmail(params).promise();

    } catch (error) {
        console.log(" SES - error : ", error)
        logger.error(new Error(`Email sending failed: ${error}`));
        throw new Error(error);
    }
};


module.exports = {
    simpleEmailService
}