const { render } = require('template-file');
const fs = require('fs');
const path = require('path');
const { renderEmail } = require('../../email/utils');
const logger = require('../../config/logger');
const emailService = require('../../email/service/emailService');
const { Config } = require('../../config/models');

class machineEmailService {
    constructor() {
        this.email = new emailService();
    }

    machineCustomerChange = async ({ req, machine, loginUser }) => {
        try {
            const toEmailsQuery = { name: /^EMAILADDRESS_NOTIFY_CHANGE_MACHINE$/i, type: "ADMIN-CONFIG", isArchived: false, isActive: true }
            const toEmails = await Config.findOne(toEmailsQuery).select('value');

            if (!toEmails) {
                logger.error("Machine customer change Email reciver not defined!");
                return
            }

            const appUrl = process.env.ADMIN_PORTAL_APP_URL;
            const machineUrl = `${appUrl}/products/machines/${req.params.id}/view`;
            const adminMachineUri = `<a href=${machineUrl} target="_blank" ><strong>${machine?.serialNo}</strong></a>`;

            // TO EMAILS
            const text = `Machine ${adminMachineUri} customer has been changed by <strong>${loginUser?.name || ""} (${loginUser?.email || ''})</strong>.`;

            // SUBJECT
            const subjectQuery = { name: /^MACHINE-CUSTOMER-UPDATE-SUBJECT$/i, type: "ADMIN-CONFIG", isArchived: false, isActive: true }
            const subject = await Config.findOne(subjectQuery).select('value');

            // Prepare Email Params
            let params = { toEmails, subject: subject?.value || 'Machine customer changed' };
            // Read Email Template and Render
            const contentHTML = await fs.promises.readFile(path.join(__dirname, "../../email/templates/customerUpdate.html"), "utf8");
            const content = render(contentHTML, { text });
            const htmlData = await renderEmail(subject, content);

            // Send Email
            params.htmlData = htmlData;
            req.body = { ...req.body, ...params };
            await this.email.sendEmail(req);
        } catch (error) {
            logger.error(new Error(error));
            throw error;
        }
    };

}


module.exports = new machineEmailService();
