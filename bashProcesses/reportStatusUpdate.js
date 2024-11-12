
const mongoose = require('mongoose');
const mongoose__ = require('../appsrc/modules/db/dbConnection');
const { ProductServiceReports, ProductServiceReportStatuses } = require('../appsrc/modules/products/models'); 

async function updateReports() {
  try {
    const distinctStatuses = await ProductServiceReports.distinct('status');

    const statusMap = {};
    for (const statusName of distinctStatuses) {
      if (typeof statusName === 'string') {
        const reportStatus = await ProductServiceReportStatuses.findOne({ 
          name: new RegExp(`^${statusName}$`, 'i'), isActive: true, isArchived: false
        });
        if (reportStatus) {
          statusMap[statusName.toLowerCase()] = reportStatus._id;
        }
      }
    }

    const reports = await ProductServiceReports.find();
    for (const report of reports) {
      const oldStatus = report.status;

      if (oldStatus && typeof oldStatus === 'string') {
        report.oldStatus = oldStatus;
        report.status = statusMap[oldStatus.toLowerCase()] || null;
        await report.save();
        console.log(`Updated report ${report._id}: oldStatus set to ${oldStatus}, new status set to ${report.status}`);
      }
    }

    console.log('Update complete');
  } catch (error) {
    console.error('Error updating reports:', error);
  }
}
updateReports();
