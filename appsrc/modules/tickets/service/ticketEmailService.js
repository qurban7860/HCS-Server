const { render } = require('template-file');
const fs = require('fs');
const path = require('path');
const { renderEmail } = require('../../email/utils');
const logger = require('../../config/logger');
const ticketDBService = require('../service/ticketDBService');
const emailService = require('../../email/service/emailService');
const { Config } = require('../../config/models');
const { Ticket } = require('../models');
const { Customer, CustomerContacts } = require('../../crm/models');

class TicketEmailService {
  constructor() {
    this.email = new emailService();
    this.dbservice = new ticketDBService();
    this.populate = [
      { path: 'status', select: 'name statusType', populate: { path: 'statusType', select: ' name slug ' } },
      { path: 'priority', select: 'name' },
      { path: 'reporter', select: 'firstName lastName email customer', populate: { path: 'customer', select: 'type' } },
      { path: 'assignee', select: 'firstName lastName email customer', populate: { path: 'customer', select: 'type' } },
      { path: 'approvers', select: 'firstName lastName email customer', populate: { path: 'customer', select: 'type' } },
      { path: 'createdBy', select: 'name contact', populate: { path: 'contact', select: 'firstName lastName email' } },
      { path: 'updatedBy', select: 'name contact', populate: { path: 'contact', select: 'firstName lastName email' } },
    ];
  }

  sendSupportTicketEmail = async (req) => {
    try {
      const portalUrl = process.env.PORTAL_APP_URL;
      const adminPortalUrl = process.env.ADMIN_PORTAL_APP_URL
      // Determine Email Subject
      const subject = req.body.isNew ? "Support Ticket Created" : "Support Ticket Updated";

      // Fetch Ticket Data
      const ticketData = await this.dbservice.getObjectById(Ticket, this.fields, req.params.id, this.populate);

      const username = ticketData?.updatedBy?.name;

      // Ensure unique emails using a Set
      const toEmails = new Set();

      // Get Ticket No Prefix
      const regex = new RegExp("^Ticket_Prefix$", "i");
      const configObject = await Config.findOne({
        name: regex,
        type: "ADMIN-CONFIG",
        isArchived: false,
        isActive: true
      }).select("value");

      // Generate Ticket URL for Admin Portal
      const adminTicketUri = `<a href="${adminPortalUrl}support/supportTickets/${req.params.id}/view" target="_blank">
        <strong>${configObject?.value?.trim() || ""} ${ticketData?.ticketNo}</strong>
      </a>`;

      // Default Email Text
      let text = `Support Ticket ${adminTicketUri} has been created by <strong>${username || ""}</strong>.`;

      // Check for Updates
      if (!req.body.isNew) {

        if ( req.body.status && req.body.status !== ticketData.status?._id) {
          text = `Support Ticket ${adminTicketUri} Status has been updated by <strong>${username || ""}</strong>.`;
        }

        if ( req.body.priority && req.body.priority !== ticketData.priority?._id) {
          text = `Support Ticket ${adminTicketUri} Priority has been updated by <strong>${username || ""}</strong>.`;
        }

        if ( req.body.reporter && req.body.reporter !== ticketData.reporter?._id) {
          text = `Support Ticket ${adminTicketUri} Reporter has been updated by <strong>${username || ""}</strong>.`;
        }

        if ( req.body.summary && req.body.summary?.trim() !== ticketData.summary?.trim()) {
          text = `Support Ticket ${adminTicketUri} Summary has been updated by <strong>${username || ""}</strong>.`;
        }

        if ( req.body.description && req.body.description?.trim() !== ticketData.description?.trim()) {
          text = `Support Ticket ${adminTicketUri} Description has been updated by <strong>${username || ""}</strong>.`;
        }

        if (
          Array.isArray(req.body.approvers) &&
          Array.isArray(ticketData.approvers) &&
          (
            req.body.approvers.length !== ticketData.approvers.length ||
            !req.body.approvers.every(id => ticketData.approvers.some(appr => appr._id === id ))
          )
        ) {
          text = `Support Ticket ${adminTicketUri} Approvers have been updated by <strong>${username || ""}</strong>.`;
          ticketData.approvers.forEach((approver) => {
            if (approver.email) toEmails.add(approver.email);
          });
        } else if( req.body.assignee && req.body.assignee !== ticketData?.assignee?._id ){
          if (ticketData.assignee?.email) toEmails.add(ticketData.assignee.email);
        } else {
          if (ticketData.reporter?.email) toEmails.add(ticketData.reporter.email);
          if (ticketData.assignee?.email) toEmails.add(ticketData.assignee.email);
        }

      } else {
        // Collect Unique Email Addresses
        if (ticketData.reporter?.email) toEmails.add(ticketData.reporter.email);
        if (ticketData.assignee?.email) toEmails.add(ticketData.assignee.email);
        if (ticketData.approvers?.length) {
          ticketData.approvers.forEach((approver) => {
            if (approver.email) toEmails.add(approver.email);
          });
        }
      }

      // Prepare Email Params
      let params = {
        toEmails: Array.from(toEmails),
        subject,
      };

      // Read Email Template and Render
      const contentHTML = await fs.promises.readFile(
        path.join(__dirname, "../../email/templates/supportTicket.html"),
        "utf8"
      );
      const content = render(contentHTML, { text });
      const htmlData = await renderEmail(req.body.subject, content);

      // Send Email
      params.htmlData = htmlData;
      req.body = { ...params };
      await this.email.sendEmail(req);
    } catch (error) {
      logger.error(new Error(error));
      throw error;
    }
  };
}


module.exports = TicketEmailService;
