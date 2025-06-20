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
const { getMentionEmails } = require('../../../../utils/getMentionEmails');

class TicketEmailService {
  constructor() {
    this.email = new emailService();
    this.dbservice = new ticketDBService();
    this.populate = [
      { path: 'status', select: 'name statusType', populate: { path: 'statusType', select: ' name slug ' } },
      { path: 'requestType', select: 'name' },
      { path: 'priority', select: 'name' },
      { path: 'reporter', select: 'firstName lastName email customer', populate: { path: 'customer', select: 'type' } },
      { path: 'assignees', select: 'firstName lastName email customer', populate: { path: 'customer', select: 'type' } },
      { path: 'approvers', select: 'firstName lastName email customer', populate: { path: 'customer', select: 'type' } },
      { path: 'updatedBy', select: 'name contact', populate: { path: 'contact', select: 'firstName lastName email' } },
    ];
  }

  sendSupportTicketEmail = async (req, oldObj = null) => {
    try {
      const portalUrl = process.env.PORTAL_APP_URL;
      const adminPortalUrl = process.env.ADMIN_PORTAL_APP_URL

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

      const ticketName = `${configObject?.value?.trim() || ""} ${ticketData?.ticketNo}`

      // Determine Email Subject
      let subject = '';
      if (req.body.isNew) {
        subject = `Support ticket ${ticketName} created`;
      }

      let url = `${adminPortalUrl}/support/supportTickets/${req.params.id}/view`

      // Generate Ticket URL for Admin Portal
      const adminTicketUri = `<a href=${url} target="_blank" >
        <strong>${ticketName}</strong>
      </a>`;

      let text = "";

      // Check for Updates
      if (!req.body?.isNew && oldObj) {

        if (oldObj?.status?._id?.toString() != ticketData.status?._id?.toString()) {
          text = `Support Ticket ${adminTicketUri}<br/>Status has been modified by <strong>${username || ""} (${ticketData?.updatedBy?.contact?.email || ""})</strong>.`;
          status = `<strong>Status: </strong>${ticketData?.status?.name || ""}<br>`;
          subject = `Support ticket ${ticketName}. Status updated`
        }

        if (oldObj?.priority?._id?.toString() != ticketData.priority?._id?.toString()) {
          text = `Support Ticket ${adminTicketUri} <br/>Priority has been modified by <strong>${username || ""} (${ticketData?.updatedBy?.contact?.email || ""})</strong>.`;
          priority = `<strong>Priority: </strong>${ticketData?.priority?.name || ""}<br>`;
          subject = `Support ticket ${ticketName}. Priority updated`
        }

        if (oldObj?.summary?.trim() !== ticketData.summary?.trim()) {
          text = `Support Ticket ${adminTicketUri} <br/>Summary has been modified by <strong>${username || ""} (${ticketData?.updatedBy?.contact?.email || ""})</strong>.`;
          subject = `Support ticket ${ticketName}. Summary updated`
        }

        if (oldObj?.description?.trim() !== ticketData.description?.trim()) {
          text = `Support Ticket ${adminTicketUri} <br/>Description has been modified by <strong>${username || ""} (${ticketData?.updatedBy?.contact?.email || ""})</strong>.`;
          description = `<strong>Description: </strong>${ticketData?.description || ""}<br>`;
          subject = `Support ticket ${ticketName}. Description updated`
        }

        if (oldObj?.reporter?._id?.toString() != ticketData.reporter?._id?.toString()) {
          text = `Support Ticket ${adminTicketUri} <br/>Reporter has been modified by <strong>${username || ""} (${ticketData?.updatedBy?.contact?.email || ""})</strong>.`;
          subject = `Support ticket ${ticketName}. Reporter updated`
          if (ticketData.reporter?.email) toEmails.add(ticketData.reporter.email);
        }

        const oldAssigneeIds = (oldObj?.assignees || []).map(a => a._id?.toString());
        const newAssigneeIds = (ticketData?.assignees || []).map(a => a._id?.toString());

        const hasAssigneeChanged = (
          oldAssigneeIds?.length !== newAssigneeIds?.length ||
          oldAssigneeIds?.some(id => !newAssigneeIds?.includes(id)) ||
          newAssigneeIds?.some(id => !oldAssigneeIds?.includes(id))
        );

        if (hasAssigneeChanged) {
          text = `Support Ticket ${adminTicketUri} <br/>Assignees have been modified by <strong>${username || ""} (${ticketData?.updatedBy?.contact?.email || ""})</strong>.`;
          subject = `Support ticket ${ticketName}. Assignees updated`;

          for (const assignee of ticketData.assignees || []) {
            if (assignee.email) toEmails.add(assignee.email);
          }
        }


        const oldApproverIds = (oldObj?.approvers || []).map(a => a._id?.toString());
        const newApproverIds = (ticketData?.approvers || []).map(a => a._id?.toString());

        const hasApproverChanged = (
          oldApproverIds?.length !== newApproverIds?.length ||
          oldApproverIds?.some(id => !newApproverIds?.includes(id)) ||
          newApproverIds?.some(id => !oldApproverIds?.includes(id))
        );

        if (hasApproverChanged) {
          text = `Support Ticket ${adminTicketUri} <br/>Approvers have been modified by <strong>${username || ""} (${ticketData?.updatedBy?.contact?.email || ""})</strong>.`;
          subject = `Support ticket ${ticketName}. Approvers updated`
          ticketData?.approvers?.forEach((approver) => {
            if (approver.email) toEmails.add(approver.email);
          });
        }

        if (toEmails.size === 0) {
          const reporterEmail = ticketData.reporter?.email;
          if (reporterEmail) toEmails.add(reporterEmail);

          for (const assignee of ticketData?.assignees || []) {
            if (assignee.email) toEmails.add(assignee.email);
          }
        }

      } else {
        // Default Email Text
        text = `Support Ticket ${adminTicketUri} has been created by <strong>${username || ""}</strong>.`;
        // Collect Unique Email Addresses
        if (ticketData.reporter?.email) toEmails.add(ticketData.reporter.email);
        ticketData?.assignees?.forEach((assignee) => {
          if (assignee.email) toEmails.add(assignee.email);
        });
        if (ticketData.approvers?.length) {
          ticketData?.approvers.forEach((approver) => {
            if (approver.email) toEmails.add(approver.email);
          });
        }
      }

      if (!text) {
        return;
      }
      if (toEmails.has(req.body.loginUser.email)) {
        toEmails.delete(req.body.loginUser.email)
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
      req.body = { ...req.body, ...params };
      req.body.ticket = req.params.id
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

      // Fetch Ticket Data
      const ticketData = await this.dbservice.getObjectById(Ticket, this.fields, req.params.ticketId, this.populate);
      const comment = await this.dbservice.getObjectById(TicketComment, this.fields, req.params.id, this.populate);
      const username = comment?.updatedBy?.name || "";

      const commentAudit = `<i style="display: block; text-align: right; color:gray; font-size:11px;" >${fDateTime(comment?.updatedAt)} by ${username}</i>`
      const comments = `<strong>Comment: </strong>${comment?.comment || ""} <br/> ${commentAudit || ""}`
      const summary = `</strong>${ticketData?.summary || ""}`;

      // Ensure unique emails using a Set
      const toEmails = new Set()

      if (ticketData?.reporter?.email && !req.body.isInternal) {
        toEmails.add(ticketData?.reporter?.email);
      }
      if (req.body.isInternal) {
        ticketData?.assignees?.forEach((assignee) => {
          if (assignee.email) toEmails.add(assignee.email);
        });
        const emails = getMentionEmails(comment?.comment)
        if (Array.isArray(emails) && emails?.length > 0) {
          emails?.forEach(email => toEmails?.add(email))
        }
      }
      // Get Ticket No Prefix
      const regex = new RegExp("^Ticket_Prefix$", "i");
      const configObject = await Config.findOne({
        name: regex,
        type: "ADMIN-CONFIG",
        isArchived: false,
        isActive: true
      }).select("value");

      const ticketName = `${configObject?.value?.trim() || ""} ${ticketData?.ticketNo}`

      // Determine Email Subject
      let subject = `Support ticket ${ticketName}. Comment updated`;
      if (req.body.isNew) {
        subject = `Support ticket ${ticketName}. New comment`;
      }

      // Generate Ticket URL for Admin Portal
      let url = `${adminPortalUrl}/support/supportTickets/${req.params.ticketId}/view`
      const adminTicketUri = `<a href=${url} target="_blank" ><strong>${ticketName}</strong></a>`;
      let text = `Support Ticket ${adminTicketUri} <br/>Comment has been ${!req.body?.isNew ? "modified" : "posted"} by <strong>${username || ""} (${comment?.updatedBy?.contact?.email || ""})</strong>.`;


      if (!text) {
        return;
      }
      if (toEmails.has(req.body.loginUser.email)) {
        toEmails.delete(req.body.loginUser.email)
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
      req.body = { ...req.body, ...params };
      req.body.ticket = req.params.ticketId
      await this.email.sendEmail(req);
    } catch (error) {
      logger.error(new Error(error));
      throw error;
    }
  };
}


module.exports = TicketEmailService;
