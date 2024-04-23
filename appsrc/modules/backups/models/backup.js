const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
        name: { type: String, required: true }, // Name of the backup
        backupSize: { type: Number }, // Size of the backup
        backupType: { type: String }, // Type of backup
        databaseName: { type: String }, // Name of the database being backed up
        databaseVersion: { type: String }, // Version of the database software
        backupStatus: { type: String }, // Status of the backup
        backupLocation: { type: String }, // Location where the backup is stored
        backupMethod: { type: String }, // Method used for backup
        backupDuration: { type: Number }, // Duration of the backup process
},
{
        collection: 'Backups'
});

docSchema.add(baseSchema.docAuditSchema);
docSchema.set('timestamps', true);

module.exports = mongoose.model('Backup', docSchema);