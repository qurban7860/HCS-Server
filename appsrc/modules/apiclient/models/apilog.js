const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
        requestMethod: { type: String , required: true },
	//The HTTP method used for the API request (e.g., GET, POST, PUT, DELETE).

        requestURL: { type: String , required: true },
        //The full URL path of the API request.

        requestHeaders: { type: Schema.Types.Mixed, required: true },
        //Capture the headers sent with the API request. Include details like authorization headers, content type, etc.

        // requestBody: { type: Schema.Types.Mixed },
        // // Capture the payload or data sent in the API request.

        machine: [{ type: Schema.Types.ObjectId , ref: 'Machine' }],
        // Machine

        customer: { type: Schema.Types.ObjectId , ref: 'Customer' },
        // customer

        apiType: {type: String, enum: ['INI', 'MACHINE-INTEGRATION', 'MACHINE-LOGS', 'OTHER'], default: 'OTHER'},

        refUUID: { type: Schema.Types.ObjectId},

        responseTime: { type: String , required: true },
        // response Time.

        response: { type: String , required: true },
        //Indicates whether the request was approved, denied, or any other relevant outcome.

        responseStatusCode: { type: Number , required: true },
        //The HTTP status code returned by your application (e.g., 200 for success, 404 for not found)
                
        additionalContextualInformation: { type: String }, 
        //Any additional information that may be relevant for troubleshooting or analysis. This could include user IDs, session information, etc.
},
{
        collection: 'APILogs'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docAuditSchemaForPublic);

docSchema.index({"name":1})
docSchema.index({"countries":1})

module.exports = mongoose.model('APILog', docSchema);