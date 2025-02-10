const AWS = require('aws-sdk');
const mailComposer = require('mailcomposer');
const logger = require('../../modules/config/logger');

const emailDataComposer = async (params) => {
    try {
        const { Source, from, Destination, Message, attachments } = params;
        const toAddresses = Destination?.ToAddresses || [];
        const ccAddresses = Destination?.CcAddresses || [];
        const bccAddresses = Destination?.BccAddresses || [];
        
        const mail = mailComposer({
            Source,
            from,
            to: toAddresses, 
            cc: ccAddresses,
            bcc: bccAddresses,
            replyTo: process.env.AWS_SES_FROM_EMAIL,
            subject: Message.Subject?.Data || 'No Subject',
            html: Message.Body?.Html?.Data || undefined,
            text: Message.Body?.Text?.Data || 'No Body Content',
            attachments: attachments?.map((file) => ({
                filename: file.Name, 
                content: file.Content, 
            })),
        });
        const data = await new Promise((resolve, reject) => {
            mail.build((err, builtMessage) => {
                if (err) {
                    return reject(`Error building email: ${err}`);
                }
                resolve(builtMessage);
            });
        });
        return data;
    } catch (error) {
        logger.error(new Error(`Failed to send email with Attachment: ${error}`));
        throw new Error('Email sending failed');
    }
}


const structureEmailParams = async ( params ) => {
    return {
        Source: params?.fromEmail,
        ...(process.env.AWS_SES_FROM_EMAIL && {
            ReplyToAddresses: [ process.env.AWS_SES_FROM_EMAIL ],
        }),
        Destination: {
            ToAddresses: (Array.isArray(params?.toEmails) && params.toEmails.length > 0) ? params.toEmails : [process.env.FALLBACK_EMAIL],
            ...(params?.ccAddresses && {
                CcAddresses: Array.isArray(params?.ccEmails) ? params.ccEmails : [ params?.ccEmails ].filter(Boolean),
            }),
            ...(params?.bccAddresses && {
                BccAddresses: Array.isArray(params?.bccEmails) ? params.bccEmails : [ params?.bccEmails ].filter(Boolean),
            })
        },
        Message: {
            Subject: {
                Charset: 'UTF-8',
                Data: params.subject
            },
            Body: {
                ...(params?.htmlData
                    ? {
                        Html: {
                            Charset: 'UTF-8',
                            Data: params.htmlData,
                        },
                    }
                    : {
                        Text: {
                            Charset: 'UTF-8',
                            Data: params.body || 'No Body Content',
                        },
                    }
                ),
            },
        },
        ...(params?.attachments && {
            attachments: Array.isArray(params?.attachments)
                ? await params.attachments?.map((file) => ({
                    Name: file?.originalname, 
                    Content: file?.buffer,
                }))
                : [{
                    Name: params?.attachments?.originalname, 
                    Content: params?.attachments?.buffer,
                }],
        }),
        
    };
}

const simpleEmailService = async ( emailParams ) => {
    try {
        const email = new AWS.SES({ region: process.env.AWS_REGION });
        const params = await structureEmailParams( emailParams );
        if(params?.attachments){
            const Data = await emailDataComposer( params );
            return  await SES.sendRawEmail({ RawMessage: { Data } }).promise();
        }
        await email.sendEmail( params ).promise();
    } catch (error) {
        logger.error(new Error(`Email sending failed: ${error}`));
        throw new Error('Email sending failed!');
    }
};


module.exports = {
    simpleEmailService
}