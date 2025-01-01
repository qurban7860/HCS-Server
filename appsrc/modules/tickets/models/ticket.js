const mongoose = require('mongoose');
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;

const docSchema = new Schema({

        customer: { type: Schema.Types.ObjectId, required: true, ref: 'Customer' },

        machine: { type: Schema.Types.ObjectId, required: true, ref: 'Machine' },

        issueType: { type: String , required: true },
        
        description: { type: String  },

        summary: { type: String  },

        changeType: { type: String  },

        impact: { type: String  },

        priority: { type: String  },

        status: { type: String  },

        // files: [{ type: Schema.Types.ObjectId, ref: 'File' }],

        changeReason: { type: String  },

        implementationPlan: { type: String  },

        backoutPlan: { type: String  },

        testPlan: { type: String  },

        components: { type: String  },

        groups: { type: String  },

        shareWith: { type: String  },

        investigationReason: { type: String  },

        rootCause: { type: String  },

        workaround: { type: String  },

        plannedStartDate: { type: Date  },

        plannedEndDate: { type: Date  },
},
{
        collection: 'Tickets'
});

docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);
docSchema.set('timestamps', true);
docSchema.index({"customer":1})
docSchema.index({"machine":1})

module.exports = mongoose.model('Ticket', docSchema);