const Yup = require('yup');
const { Types: { ObjectId } } = require('mongoose');

const ticketSchema = (reqType ) => {
    const isNewRequest = reqType === 'new';
    return Yup.object().shape({

        customer: Yup.string().label('Customer')
        .test('is-objectid', 'Invalid Customer ID!', ( customerId ) => {
            if(!customerId) {
                return true;
            }
            return ObjectId.isValid(customerId);
        }).when([], {
            is: () => isNewRequest,
            then: (schema) => schema.required(),
            otherwise: (schema) => schema.nullable().notRequired(),
        }), 

        machine: Yup.string().label('Machine')
        .test('is-objectid', 'Invalid Machine ID!', ( machineId ) => {
            if( !machineId ) {
                return true;
            }
            return ObjectId.isValid(machineId);
        }).when([], {
            is: () => isNewRequest,
            then: (schema) => schema.required(),
            otherwise: (schema) => schema.nullable().notRequired(),
        }), 

        issueType: Yup.string().label('Issue Type')
        .test('is-objectid', 'Invalid Issue Type ID!', ( issueTypeId ) => {
            if(!issueTypeId) {
                return true;
            }
            return ObjectId.isValid( issueTypeId );
        }).when([], {
            is: () => isNewRequest,
            then: (schema) => schema.required(),
            otherwise: (schema) => schema.nullable().notRequired(),
        }), 

        reporter: Yup.string().nullable().label('Reporter')
        .test('is-objectid', 'Invalid Reporter ID!', (reporterId) => {
            if(!reporterId) {
                return true;
            }
            return ObjectId.isValid(reporterId);
        }),

        assignee: Yup.string().nullable().label('Assignee')
        .test('is-objectid', 'Invalid Assignee ID!', (assigneeId) => {
            if(!assigneeId) {
                return true;
            }
            return ObjectId.isValid(assigneeId);
        }),

        changeType: Yup.string().nullable().label('Change Type')
        .test('is-objectid', 'Invalid Change Type ID!', (changeTypeId) => {
            if(!changeTypeId) {
                return true;
            }
            return ObjectId.isValid(changeTypeId);
        }),

        impact: Yup.string().nullable().label('Impact')
        .test('is-objectid', 'Invalid Impact ID!', (impactId) => {
            if(!impactId) {
                return true;
            }
            return ObjectId.isValid(impactId);
        }),

        priority: Yup.string().nullable().label('Priority')
        .test('is-objectid', 'Invalid Priority ID!', (priorityId) => {
            if(!priorityId) {
                return true;
            }
            return ObjectId.isValid(priorityId);
        }),

        status: Yup.string().nullable().label('Status')
        .test('is-objectid', 'Invalid Status ID!', (statusId) => {
            if(!statusId) {
                return true;
            }
            return ObjectId.isValid(statusId);
        }),

        changeReason: Yup.string().nullable().label('Change Reason')
        .test('is-objectid', 'Invalid Change Reason ID!', (changeReasonId) => {
            if(!changeReasonId) {
                return true;
            }
            return ObjectId.isValid(changeReasonId);
        }),

        investigationReason: Yup.string().nullable().label('Investigation Reason')
        .test('is-objectid', 'Invalid Investigation Reason ID!', ( investigationReasonId ) => {
            if(!investigationReasonId) {
                return true;
            }
            return ObjectId.isValid( investigationReasonId );
        }),

        files: Yup.mixed().label("Files").nullable().notRequired(),
        images: Yup.mixed().label("Files").nullable().notRequired(),

        description: Yup.string().label('Description').max(10000).nullable().notRequired(),
        summary: Yup.string().label('Summary').max(5000).nullable().notRequired(),
        implementationPlan: Yup.string().label('Implementation Plan').max(10000).nullable().notRequired(),
        backoutPlan: Yup.string().label('Backout Plan').max(10000).nullable().notRequired(),
        testPlan: Yup.string().label('Test Plan').max(10000).nullable().notRequired(),
        groups: Yup.string().label('Root Cause').max(5000).nullable().notRequired(),
        rootCause: Yup.string().label('Internal Note').max(10000).nullable().notRequired(),
        workaround: Yup.string().label('Work Around').max(10000).nullable().notRequired(),

        plannedStartDate: Yup.date().label("Planned Start Date").nullable().notRequired(),
        plannedEndDate: Yup.date().label("Planned End Date").nullable().notRequired(),

        shareWith: Yup.boolean().nullable().notRequired(),
        isActive: Yup.boolean().nullable().notRequired(),
        isArchived: Yup.boolean().nullable().notRequired(),
        
    });
};




module.exports = {
    ticketSchema
};
