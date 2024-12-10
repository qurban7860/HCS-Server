const { render } = require('template-file');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');
var async = require("async");
const fs = require('fs');
const path = require('path');
const { renderEmail } = require('../../email/utils');
const { SecurityUser, SecurityUserInvite } = require('../models');
const { generateRandomString, updateUserToken } = require('./authHelper');
const logger = require('../../config/logger');
const securityDBService = require('../service/securityDBService');
const emailService = require('../../email/service/emailService');
const { Config } = require('../../config/models');
let rtnMsg = require('../../config/static/static')
const portalUrl = process.env.PORTAL_APP_URL;
const adminPortalUrl = process.env.ADMIN_PORTAL_APP_URL
this.populate = [
  { path: "customer", select: "name type isActive" },
  { path: "contact", select: "firstName lastName email formerEmployee isActive" },
];

class UserEmailService {
  constructor() {
    this.email = new emailService();
    this.dbservice = new securityDBService();
  }

  sendMfaEmail = async ( req, res, user ) => {
    try{ 
      let userMFAData = {};
      const emailSubject = "Multi-Factor Authentication Code";
      const code = Math.floor(100000 + Math.random() * 900000);
      const username = user.name;
      let params = {
          toEmails: `${user.email}`,
          subject: emailSubject,
      };

      const contentHTML = await fs.promises.readFile(path.join(__dirname, '../../email/templates/MFA.html'), 'utf8');
      const content = render(contentHTML, { username, code });
      const htmlData =  await renderEmail(emailSubject, content )
      params.htmlData = htmlData;
      req.body = { ...params };

      
      userMFAData.multiFactorAuthenticationCode = code;
      const currentDate = new Date();
      userMFAData.multiFactorAuthenticationExpireTime = new Date(currentDate.getTime() + 10 * 60 * 1000);
      await this.dbservice.patchObject(SecurityUser, user._id, userMFAData);
      await this.email.sendEmail( req );
      return res.status(StatusCodes.ACCEPTED).send({message:'Authentication Code has been sent on your email!', multiFactorAuthentication:true, userId:user._id});
    }catch(error){
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('MFA Code Sending Fails!');
    }
  }

  sendUserInviteEmail = async (req, res ) => {
    try{
      this.populate = [
        { path: "customer", select: "name type isActive" },
        { path: "contact", select: "firstName lastName email formerEmployee isActive" },
      ];
      let user = await this.dbservice.getObjectById(SecurityUser, this.fields, req.params.id, this.populate);

      if(!user?._id){
        if (res) {
          return res.status(StatusCodes.BAD_REQUEST).send('User not found!');
        } 
        throw new Error('User not found!');
      }
      let userInvite = new SecurityUserInvite({});
      userInvite.inviteCode = (Math.random() + 1).toString(36).substring(7);
      let inviteCodeExpireHours = parseInt(process.env.INVITE_EXPIRE_HOURS);
      if(isNaN(inviteCodeExpireHours))
        inviteCodeExpireHours = 48;
      let expireAt = new Date().setHours(new Date().getHours() + inviteCodeExpireHours);
      const link = `${ adminPortalUrl }/invite/${req.params.id}/${userInvite.inviteCode}/${expireAt}`;
      user.invitationStatus = true;
      user.save();
      userInvite.senderInvitationUser = req.body.loginUser.userId;
      userInvite.receiverInvitationUser = req.params.id;
      userInvite.receiverInvitationEmail = user.email;

      userInvite.inviteExpireTime = expireAt;
      userInvite.invitationStatus = 'PENDING';
      await userInvite.save();
      let emailSubject = "User Invite - HOWICK Portal";
      const regex = new RegExp("^USER-INVITE-SUBJECT$", "i"); let configObject = await Config.findOne({name: regex, type: "ADMIN-CONFIG", isArchived: false, isActive: true}).select('value');
      if(configObject && configObject?.value)
          emailSubject = configObject.value;
      let params = {
          toEmails: `${user.email}`,
          subject: emailSubject,
      };

      const contentHTML = await fs.promises.readFile(path.join(__dirname, '../../email/templates/userInvite.html'), 'utf8');
      const content = render(contentHTML, { username: user.name, link });
      const htmlData =  await renderEmail(emailSubject, content )
      params.htmlData = htmlData;
      req.body = { ...params };
      await this.email.sendEmail( req );
      if (res) {
        res.status(StatusCodes.OK).send('Invitation Sent Successfully!');
      }
      return null
    }catch(error){
      logger.error(new Error(error));
      if (res) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Invitation Sending Failed!');
      }
      throw error;
    }
  }

  resetPasswordEmail = async ( req, res, toUser ) => {
    try{
      const token = await generateRandomString();
      let updatedToken = await updateUserToken(token);
      await this.dbservice.patchObject(SecurityUser, toUser._id, updatedToken );
      const link = `${ toUser?.customer?.type?.toLowerCase() === 'sp' ? adminPortalUrl : portalUrl }/auth/new-password/${token}/${toUser._id}`;

          const emailSubject = "Reset Password";
          const username = toUser?.name;

          let params = {
            toEmails: `${toUser?.email}`,
            subject: emailSubject,
          };

          const contentHTML = await fs.promises.readFile(path.join(__dirname, '../../email/templates/forgetPassword.html'), 'utf8');
          const content = render(contentHTML, { username, link });
          const htmlData =  await renderEmail(emailSubject, content )
          params.htmlData = htmlData;
          params.toUser = toUser
          req.body = { ...params };
      
          await this.email.sendEmail( req );
          res.status(StatusCodes.OK).send( 'Email sent successfully!');
    }catch(error){
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Forget Password email send fails!');
    }
  }

  passwordUpdatedEmail = async ( req, res, toUser  ) => {
    try{
      const contentHTML = `
          <tr>
            <td align="left" style="padding:0;Margin:0">
              <p>
                Dear ${toUser?.name || ''},<br>
                <br>
                Your password has been updated successfully.<br>
                <br>
                Please sign in to access your account
                <br>
              </p>
            </td>
          </tr>`;
                      
      let emailSubject = "Password Reset Successful";
    
      let params = {
        toEmails: `${toUser?.email}`,
        subject: emailSubject,
      };
      
      const content = render(contentHTML);
      const htmlData =  await renderEmail(emailSubject, content )
      params.htmlData = htmlData;
      params.toUser = toUser
      req.body = { ...params };
    
      await this.email.sendEmail( req );
      res.status(StatusCodes.ACCEPTED).send(rtnMsg.recordCustomMessageJSON(StatusCodes.ACCEPTED, 'Password updated successfully!'));
    } catch(error){
      logger.error(new Error(error));
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(rtnMsg.recordCustomMessageJSON(StatusCodes.ACCEPTED, 'Password update failed!'));
    }
  }

}


module.exports = UserEmailService;
