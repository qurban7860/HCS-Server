const { render } = require('template-file');
const fs = require('fs');
const path = require('path');
const { renderEmail } = require('../../email/utils');
const logger = require('../../config/logger');
const ticketDBService = require('../service/ticketDBService');
const emailService = require('../../email/service/emailService');
const { Config } = require('../../config/models');
const { Ticket, TicketComment } = require('../models');
const { fDateTime } = require('../../../../utils/formatTime');

class TicketEmailService {
  constructor() {
    this.email = new emailService();
    this.dbservice = new ticketDBService();
    this.populate = [
      { path: 'status', select: 'name statusType', populate: { path: 'statusType', select: ' name slug ' } },
      { path: 'requestType', select: 'name' },
      { path: 'priority', select: 'name' },
      { path: 'reporter', select: 'firstName lastName email customer', populate: { path: 'customer', select: 'type' } },
      { path: 'assignee', select: 'firstName lastName email customer', populate: { path: 'customer', select: 'type' } },
      { path: 'approvers', select: 'firstName lastName email customer', populate: { path: 'customer', select: 'type' } },
      { path: 'createdBy', select: 'name contact', populate: { path: 'contact', select: 'firstName lastName email' } },
      { path: 'updatedBy', select: 'name contact', populate: { path: 'contact', select: 'firstName lastName email' } },
    ];
  }

  sendSupportTicketEmail = async (req, oldObj = null) => {
    try {
      const portalUrl = process.env.PORTAL_APP_URL;
      const adminPortalUrl = process.env.ADMIN_PORTAL_APP_URL
      // Determine Email Subject
      let subject = "Support Ticket Updated";
      if (req.body.isNew) {
        subject = "Support Ticket Created";
      }
      // Fetch Ticket Data
      const ticketData = await this.dbservice.getObjectById(Ticket, this.fields, req.params.id, this.populate);

      let requestType = ticketData?.requestType?.name || ""
      let status = ""
      let priority = ""
      let summary = ticketData?.summary || ""
      let description = ""

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
      let portalUri = `${adminPortalUrl}/support/supportTickets/${req.params.id}/view`
      let url = portalUri;

      // Generate Ticket URL for Admin Portal
      const adminTicketUri = `<a href=${portalUri} target="_blank" >
        <strong>${configObject?.value?.trim() || ""} ${ticketData?.ticketNo}</strong>
      </a>`;
      let text = "";

      // Check for Updates
      if (!req.body?.isNew && oldObj) {

        if (oldObj?.status && oldObj?.status?.toString() != ticketData.status?._id?.toString()) {
          text = `Support Ticket ${adminTicketUri}<br/>Status has been modified by <strong>${username || ""}</strong>.`;
          status = `<strong>Status: </strong>${ticketData?.status?.name || ""}<br>`;
        }

        if (oldObj?.priority && oldObj?.priority?.toString() != ticketData.priority?._id?.toString()) {
          text = `Support Ticket ${adminTicketUri} <br/>Priority has been modified by <strong>${username || ""}</strong>.`;
          priority = `<strong>Priority: </strong>${ticketData?.priority?.name || ""}<br>`;
        }

        if (oldObj?.reporter && oldObj?.reporter?.toString() != ticketData.reporter?._id?.toString()) {
          text = `Support Ticket ${adminTicketUri} <br/>Reporter has been modified by <strong>${username || ""}</strong>.`;
        }

        if (oldObj?.summary && oldObj?.summary?.trim() !== ticketData.summary?.trim()) {
          text = `Support Ticket ${adminTicketUri} <br/>Summary has been modified by <strong>${username || ""}</strong>.`;
        }

        if (oldObj?.description && oldObj?.description?.trim() !== ticketData.description?.trim()) {
          text = `Support Ticket ${adminTicketUri} <br/>Description has been modified by <strong>${username || ""}</strong>.`;
          description = `<strong>Description: </strong>${ticketData?.description || ""}<br>`;
        }

        if (oldObj.assignee?.toString() != ticketData?.assignee?._id?.toString()) {
          if (ticketData.assignee?.email) toEmails.add(ticketData.assignee.email);
          text = `Support Ticket ${adminTicketUri} <br/>Assignee has been modified by <strong>${username || ""}</strong>.`;
        }

        if (
          Array.isArray(oldObj?.approvers) &&
          Array.isArray(ticketData?.approvers) &&
          (
            oldObj?.approvers?.length !== ticketData.approvers.length ||
            !oldObj?.approvers?.every(id => ticketData?.approvers?.some(appr => appr._id?.toString() == id?.toString()))
          )
        ) {
          text = `Support Ticket ${adminTicketUri} <br/>Approvers have been modified by <strong>${username || ""}</strong>.`;
          ticketData?.approvers?.forEach((approver) => {
            if (approver.email) toEmails.add(approver.email);
          });
        } else {
          if (ticketData.reporter?.email) toEmails.add(ticketData.reporter.email);
          if (ticketData.assignee?.email) toEmails.add(ticketData.assignee.email);
        }

      } else {
        // Default Email Text
        text = `Support Ticket ${adminTicketUri} has been created by <strong>${username || ""}</strong>.`;
        // Collect Unique Email Addresses
        if (ticketData.reporter?.email) toEmails.add(ticketData.reporter.email);
        if (ticketData.assignee?.email) toEmails.add(ticketData.assignee.email);
        if (ticketData.approvers?.length) {
          ticketData?.approvers.forEach((approver) => {
            if (approver.email) toEmails.add(approver.email);
          });
        }
      }

      if (!text) {
        return;
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

      const content = render(contentHTML, { text, requestType, status, priority, summary, description, url });
      const htmlData = await renderEmail(subject, content);

      // Send Email
      params.htmlData = htmlData;
      req.body = { ...params };
      await this.email.sendEmail(req);
    } catch (error) {
      logger.error(new Error(error));
      throw error;
    }
  };

  sendSupportTicketCommentEmail = async (req) => {
    try {
      const portalUrl = process.env.PORTAL_APP_URL;
      const adminPortalUrl = process.env.ADMIN_PORTAL_APP_URL

      // Determine Email Subject
      let subject = "Support Ticket Comment Updated";
      if (req.body.isNew) {
        subject = "Support Ticket Comment Posted";
      }
      // Fetch Ticket Data
      const ticketData = await this.dbservice.getObjectById(Ticket, this.fields, req.params.ticketId, this.populate);
      const username = ticketData?.updatedBy?.name || "";

      const comment = await this.dbservice.getObjectById(TicketComment, this.fields, req.params.id, this.populate);
      const commentAudit = `<i style="display: block; text-align: right;" >${fDateTime(comment?.updatedAt)} by ${username}</i>`
      const comments = `<strong>Comment: </strong><br/>${comment?.comment || ""}<br/>${commentAudit || ""}`
      const summary = `<strong>Summary: </strong>${ticketData?.summary || ""}`;

      // Ensure unique emails using a Set
      const toEmails = new Set();
      if (ticketData.reporter?.email) toEmails.add(ticketData.reporter.email);
      if (ticketData.assignee?.email && !req.body.isInternal) toEmails.add(ticketData.assignee.email);
      // Get Ticket No Prefix
      const regex = new RegExp("^Ticket_Prefix$", "i");
      const configObject = await Config.findOne({
        name: regex,
        type: "ADMIN-CONFIG",
        isArchived: false,
        isActive: true
      }).select("value");

      // Generate Ticket URL for Admin Portal
      let portalUri = `${adminPortalUrl}/support/supportTickets/${req.params.id}/view`
      let url = portalUri;
      const adminTicketUri = `<a href=${url} target="_blank" >
            <strong>${configObject?.value?.trim() || ""} ${ticketData?.ticketNo}</strong>
          </a>`;
      let text = `Support Ticket ${adminTicketUri} comment has been ${!req.body?.isNew ? "modified" : "posted"} by <strong>${username || ""}(${ticketData?.updatedBy?.contact?.email || ""})</strong>.`;


      if (!text) {
        return;
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

      const content = render(contentHTML, { text, summary, comments, url });
      const htmlData = await renderEmail(subject, content);

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
