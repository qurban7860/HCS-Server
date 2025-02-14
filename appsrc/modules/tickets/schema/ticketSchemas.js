const Yup = require('yup');
const { Types: { ObjectId } } = require('mongoose');

const ticketSchema = (reqType) => {
    const isNewRequest = reqType === 'new';
    return Yup.object().shape({

        customer: Yup.string().label('Customer')
            .test('is-objectid', 'Invalid Customer!', (customerId) => {
                if (!customerId || customerId == "null")
                    return true;
                return ObjectId.isValid(customerId);
            }).when([], {
                is: () => isNewRequest,
                then: (schema) => schema.required(),
                otherwise: (schema) => schema.nullable().notRequired(),
            }),

        machine: Yup.string().label('Machine')
            .test('is-objectid', 'Invalid Machine!', (machineId) => {
                if (!machineId || machineId == "null")
                    return true;
                return ObjectId.isValid(machineId);
            }).when([], {
                is: () => isNewRequest,
                then: (schema) => schema.required(),
                otherwise: (schema) => schema.nullable().notRequired(),
            }),

        issueType: Yup.string().label('Issue Type')
            .test('is-objectid', 'Invalid Issue Type!', (issueTypeId) => {
                if (!issueTypeId || issueTypeId == "null")
                    return true;
                return ObjectId.isValid(issueTypeId);
            }).when([], {
                is: () => isNewRequest,
                then: (schema) => schema.required(),
                otherwise: (schema) => schema.nullable().notRequired(),
            }),

        requestType: Yup.string().label('Request Type')
            .test('is-objectid', 'Invalid Request Type!', (requestTypeId) => {
                if (!requestTypeId || requestTypeId == "null")
                    return true;
                return ObjectId.isValid(requestTypeId);
            }).when([], {
                is: () => isNewRequest,
                then: (schema) => schema.required(),
                otherwise: (schema) => schema.nullable().notRequired(),
            }),

        reporter: Yup.string().nullable().label('Reporter')
            .test('is-objectid', 'Invalid Reporter!', (reporterId) => {
                if (!reporterId || reporterId == "null")
                    return true;
                return ObjectId.isValid(reporterId);
            }),

        assignee: Yup.string().nullable().label('Assignee')
            .test('is-objectid', 'Invalid Assignee!', (assigneeId) => {
                if (!assigneeId || assigneeId == "null")
                    return true;
                return ObjectId.isValid(assigneeId);
            }),

        approvers: Yup.array().nullable().label('Assignee')
            .test('is-objectid', 'Invalid Assignee!', (assigneeIds) => {
                if (!assigneeIds || Array.isArray(assigneeIds) || assigneeIds?.length == 0)
                    return true;
                return assigneeIds?.some(id => ObjectId.isValid(id))
            }),

        changeType: Yup.string().nullable().label('Change Type')
            .test('is-objectid', 'Invalid Change Type!', (changeTypeId) => {
                if (!changeTypeId || changeTypeId == "null")
                    return true;
                return ObjectId.isValid(changeTypeId);
            }),

        impact: Yup.string().nullable().label('Impact')
            .test('is-objectid', 'Invalid Impact!', (impactId) => {
                if (!impactId || impactId == "null")
                    return true;
                return ObjectId.isValid(impactId);
            }),

        priority: Yup.string().nullable().label('Priority')
            .test('is-objectid', 'Invalid Priority!', (priorityId) => {
                if (!priorityId || priorityId == "null")
                    return true;
                return ObjectId.isValid(priorityId);
            }),

        status: Yup.string().nullable().label('Status')
            .test('is-objectid', 'Invalid Status!', (statusId) => {
                if (!statusId || statusId == "null")
                    return true;
                return ObjectId.isValid(statusId);
            }),

        changeReason: Yup.string().nullable().label('Change Reason')
            .test('is-objectid', 'Invalid Change Reason!', (changeReasonId) => {
                if (!changeReasonId || changeReasonId == "null")
                    return true;
                return ObjectId.isValid(changeReasonId);
            }),

        investigationReason: Yup.string().nullable().label('Investigation Reason')
            .test('is-objectid', 'Invalid Investigation Reason!', (investigationReasonId) => {
                if (!investigationReasonId || investigationReasonId == "null")
                    return true;
                return ObjectId.isValid(investigationReasonId);
            }),

        files: Yup.mixed().label("Files").nullable().notRequired(),
        images: Yup.mixed().label("Files").nullable().notRequired(),
        hlc: Yup.string().label('HLC').max(500).nullable().notRequired(),
        plc: Yup.string().label('PLC').max(500).nullable().notRequired(),
        description: Yup.string().label('Description').max(10000).nullable().notRequired(),
        summary: Yup.string().label('Summary').max(200).nullable().notRequired(),
        implementationPlan: Yup.string().label('Implementation Plan').max(10000).nullable().notRequired(),
        backoutPlan: Yup.string().label('Backout Plan').max(10000).nullable().notRequired(),
        testPlan: Yup.string().label('Test Plan').max(10000).nullable().notRequired(),
        groups: Yup.string().label('Root Cause').max(5000).nullable().notRequired(),
        rootCause: Yup.string().label('Internal Note').max(10000).nullable().notRequired(),
        workaround: Yup.string().label('Work Around').max(10000).nullable().notRequired(),

        plannedStartDate: Yup.mixed().label("Planned Start Date").nullable().notRequired(),
        startTime: Yup.mixed().label("Planned Start Time").nullable().notRequired(),
        plannedEndDate: Yup.mixed().label("Planned End Date").nullable().notRequired(),
        endTime: Yup.mixed().label("Planned End Time").nullable().notRequired(),

        // plannedStartDate: Yup.date().label("Planned Start Date").nullable()
        // .test('plannedStartDate', 'Start Date must be earlier than End Date', ( value, context ) => {
        //   const { plannedEndDate } = context.parent;
        //   return value && (!plannedEndDate || value < plannedEndDate);
        // }),

        // startTime: Yup.date().label("Start Time").nullable()
        // .test('startTime', 'Start Time must be earlier than End Time', ( value, context ) => {
        //   const { plannedEndDate } = context.parent;
        //   return value && (!plannedEndDate || value < plannedEndDate);
        // }),

        // plannedEndDate: Yup.date().label("Planned End Date").nullable()
        // .test('plannedEndDate', 'End Date must be later than Start Date', ( value, context ) => {
        //   const { plannedStartDate } = context.parent;
        //   return value && (!plannedStartDate || value > plannedStartDate);
        // }),

        // endTime: Yup.date().label("End Time").nullable()
        // .test('endTime', 'End Time must be later than Start Time', ( value, context ) => {
        //   const { plannedStartDate } = context.parent;
        //   return value && (!plannedStartDate || value > plannedStartDate);
        // }),

        shareWith: Yup.boolean().label("Share With").nullable().notRequired(),
        isActive: Yup.boolean().label("Active").nullable().notRequired(),
        isArchived: Yup.boolean().label("Archived").nullable().notRequired(),

    });
};




module.exports = {
    ticketSchema
};
