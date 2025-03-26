const fs = require('fs').promises;
const path = require('path');
const mailComposer = require('mailcomposer');
const { render } = require('template-file');

const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;

function filterAndDeduplicateEmails(data) {
    const seen = new Set();
    data.map(d => {
        if (emailRegex.test(d?.email?.toLowerCase()?.trim()) && !seen.has(d?.email?.toLowerCase()?.trim())) {
            seen.add(d?.email?.toLowerCase()?.trim());
        }
    });
    return seen
}

function verifyEmail(email) {
    return emailRegex.test(email?.toLowerCase()?.trim()) ? email?.toLowerCase()?.trim() : null;
}

async function loadTemplates() {
    try {
        const [headerHTML, footerHTML, emailHTML] = await Promise.all([
            fs.readFile(path.join(__dirname, '../templates/header.html'), 'utf8'),
            fs.readFile(path.join(__dirname, '../templates/footer.html'), 'utf8'),
            fs.readFile(path.join(__dirname, '../templates/emailTemplate.html'), 'utf8')
        ]);
        return { headerHTML, footerHTML, emailHTML };
    } catch (error) {
        throw new Error(`Failed to load email templates: ${error.message}`);
    }
}

async function renderEmail(subject, content) {
    try {
        let hostUrl = process.env.CLIENT_APP_URL || 'https://admin.portal.howickltd.com';

        const { headerHTML, footerHTML, emailHTML } = await loadTemplates();

        const header = render(headerHTML, { hostUrl });
        const footer = render(footerHTML, { hostUrl });

        return render(emailHTML, { subject, header, footer, content });
    } catch (e) {
        throw new Error(`Failed to render email templates: ${e.message}`);
    }
}

const emailDataComposer = async (params) => {
    try {
        const { Source, from, Destination, subject = undefined, html = undefined, Message, attachments } = params;
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
            subject: Message.Subject?.Data || subject || 'No Subject',
            html: Message.Body?.Html?.Data || html || undefined,
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
        throw new Error(error);
    }
}


const structureEmail = async (params) => {
    return {
        Source: params?.fromEmail,
        ...(params?.attachments && { from: params?.fromEmail }),
        ...(process.env.AWS_SES_FROM_EMAIL && {
            ReplyToAddresses: [process.env.AWS_SES_FROM_EMAIL],
        }),
        Destination: {
            ToAddresses: (Array.isArray(params?.toEmails) && params.toEmails.length > 0) ? params.toEmails : [process.env.FALLBACK_EMAIL],
            ...(params?.ccEmails && {
                CcAddresses: Array.isArray(params?.ccEmails) ? params.ccEmails : [params?.ccEmails].filter(Boolean),
            }),
            ...(params?.bccEmails && {
                BccAddresses: Array.isArray(params?.bccEmails) ? params.bccEmails : [params?.bccEmails].filter(Boolean),
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
                    filename: file?.originalname,
                    content: file?.buffer,
                }))
                : [{
                    filename: params?.attachments?.originalname,
                    content: params?.attachments?.buffer,
                }],
        }),

    };
}

const structureRawEmail = async (params) => {
    return {
        Source: params?.fromEmail,
        ...(params?.fromEmail && { from: params?.fromEmail }),
        ...(process.env.AWS_SES_FROM_EMAIL && {
            ReplyToAddresses: [process.env.AWS_SES_FROM_EMAIL],
        }),
        ...({ to: params.to || params.toEmails }),
        subject: params.subject,
        html: params.htmlData,
        ...(params?.attachments && {
            attachments: Array.isArray(params?.attachments)
                ? await params.attachments?.map((file) => ({
                    filename: file?.originalname,
                    content: file?.buffer,
                }))
                : [{
                    filename: params?.attachments?.originalname,
                    content: params?.attachments?.buffer,
                }],
        }),
    };
}

module.exports = {
    filterAndDeduplicateEmails,
    verifyEmail,
    renderEmail,
    emailDataComposer,
    structureEmail,
    structureRawEmail
};