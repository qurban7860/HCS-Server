const mongoose = require('mongoose');
const fs = require('fs');
const readline = require('readline');
const { parse } = require('json2csv');
const { ProductTechParamValue } = require('../appsrc/modules/products/models');
const mongoose__ = require('../appsrc/modules/db/dbConnection');


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const updateHistory = async () => {
  try {
    // Find documents where history is missing or empty
    const docs = await ProductTechParamValue.find({
      $or: [{ history: { $exists: false } }, { history: { $size: 0 } }]
    }).populate('machine', 'name');
    if (!Array.isArray(docs) || docs?.length == 0) {
      console.log(`No Record Found!`);
      rl.close();
      process.exit(0)
      return;
    }
    console.log(`Found ${docs.length} documents to update.`);

    // Ask for confirmation
    rl.question('Do you want to proceed with updating the records? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() !== 'yes') {
        console.log('Update cancelled.');
        mongoose.disconnect();
        rl.close();
        return;
      }

      // Prepare updates and collect report data
      const updates = docs.map(doc => {
        const historyEntry = {
          techParamValue: doc.techParamValue || '',
          updatedBy: doc.createdBy || null,
          updatedAt: new Date()
        };

        return {
          update: ProductTechParamValue.updateOne(
            { _id: doc._id },
            { $push: { history: historyEntry } }
          ),
          reportData: {
            _id: doc._id,
            machine: doc.machine?.name || 'N/A',
            techParamValue: doc.techParamValue || 'N/A'
          }
        };
      });

      // Execute updates
      await Promise.all(updates.map(({ update }) => update));
      console.log(`${updates.length} documents updated successfully!`);

      // Generate CSV report
      const reportData = updates.map(({ reportData }) => reportData);
      const csv = parse(reportData, { fields: ['_id', 'machine', 'techParamValue'] });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Format: YYYY-MM-DDTHH-MM-SS
      const fileName = `UpdatedProductSettingRecords_${timestamp}.csv`;
      fs.writeFileSync(fileName, csv);

      console.log(`CSV report generated: ${fileName}`);
      mongoose.disconnect();
      rl.close();
    });

  } catch (error) {
    console.error('Error updating documents:', error);
    mongoose.disconnect();
    rl.close();
  }
};

updateHistory();
