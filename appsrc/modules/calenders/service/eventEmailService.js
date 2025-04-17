const { render } = require('template-file');
const fs = require('fs');
const path = require('path');
const { filterAndDeduplicateEmails, verifyEmail, renderEmail } = require('../../email/utils');
const logger = require('../../config/logger');
const emailService = require('../../email/service/emailService');
const { Config } = require('../../config/models');
const { Ticket, TicketComment } = require('../models');
const { fDateTime } = require('../../../../utils/formatTime');

class EventEmailService {
  constructor() {
    this.email = new emailService();
  }

  sendEmailAlert = async (req, eventData, securityUser, emailSubject) => {
    try {
      const securityUserName = `An${eventData?.isCustomerEvent ? '' : ' Internal'} Event has been booked by ${securityUser?.name || ''}.`;
      const uniqueTechnicians = new Set();
      const primaryTechnicianName = `${eventData?.primaryTechnician?.firstName?.trim() || ''} ${eventData?.primaryTechnician?.lastName?.trim() || ''}`;
      if (primaryTechnicianName) uniqueTechnicians.add(primaryTechnicianName);

      if (eventData && securityUserName) {
        const primaryEmail = verifyEmail(eventData?.primaryTechnician?.email);
        let supportingContactsEmailsSet = filterAndDeduplicateEmails(eventData?.supportingTechnicians);

        if (primaryEmail && !supportingContactsEmailsSet.has(primaryEmail)) {
          supportingContactsEmailsSet = new Set([primaryEmail, ...supportingContactsEmailsSet]);
        }

        const notifyContactsEmailsSet = filterAndDeduplicateEmails(eventData?.notifyContacts);
        for (const email of supportingContactsEmailsSet) {
          notifyContactsEmailsSet.delete(email);
        }

        const notifyContactsEmails = Array.from(notifyContactsEmailsSet);
        const supportingContactsEmails = Array.from(supportingContactsEmailsSet);

        eventData.supportingTechnicians.forEach(sp => {
          const technicianName = `${sp?.firstName?.trim() || ''} ${sp?.lastName?.trim() || ''}`;
          uniqueTechnicians.add(technicianName);
        });

        let params = { subject: emailSubject, html: true };
        const customer = eventData?.isCustomerEvent ? `<strong>Customer:</strong> ${eventData?.customer?.name || ''} </br>` : '';
        const serialNo = eventData?.isCustomerEvent ? `<strong>Machine:</strong> ${eventData?.machines?.map(m => m?.serialNo) || ''} </br>` : '';
        const site = eventData?.isCustomerEvent ? `<strong>Site:</strong> ${eventData?.site?.name || ''} </br>` : '';
        const technicians = `<strong>${eventData?.isCustomerEvent ? 'Technicians' : 'Assignee'}: </strong> ${Array.from(uniqueTechnicians) || ''} </br>`;
        const description = eventData?.description || '';
        const priority = eventData?.priority || '';
        const status = eventData?.status || '';
        const createdBy = eventData?.createdBy?.name || '';
        const createdAt = new Date();
        const startTime = eventData?.start ? fDateTime(eventData?.start).toString() : '';
        const endTime = eventData?.end ? fDateTime(eventData?.end).toString() : '';

        params.to = primaryEmail;
        params.ccEmails = notifyContactsEmails;
        params.toUser = securityUser;
        params.customer = eventData?.customer?._id || null,
          params.toEmails = supportingContactsEmails

        const contentHTML = await fs.promises.readFile(path.join(__dirname, '../../email/templates/eventAlert.html'), 'utf8');
        const content = render(contentHTML, {
          securityUserName,
          customer,
          serialNo,
          site,
          technicians,
          startTime,
          endTime,
          description,
          priority,
          status,
          createdBy,
          createdAt
        });
        const htmlData = await renderEmail(emailSubject, content)
        params.htmlData = htmlData;
        req.body = { ...params };
        req.body.event = eventData?._id
        await this.email.sendEmail(req);
      }
    } catch (error) {
      logger.error(new Error(error));
      throw `Failed to send email: ${error.message}`;
    }
  };
}


module.exports = EventEmailService;
