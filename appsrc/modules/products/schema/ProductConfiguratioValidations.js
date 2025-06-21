const Yup = require('yup');
const { Types: { ObjectId } } = require('mongoose');


const productConfigurationSchema = (reqType) => {
  const isNewRequest = reqType == 'new';
  return Yup.object().shape({
    type: Yup.string().label("Type").nullable().notRequired(),

    inputSerialNo: Yup.string().label("Input Serial No.")
      .max(10, 'Input Serial No. must not exceed 50 characters')
      .notRequired(),
      // .when([], {
      //   is: () => isNewRequest,
      //   then: (schema) => schema.required(),
      //   otherwise: (schema) => schema.nullable().notRequired(),
      // }),

    inputGUID: Yup.string().label('Input GUID').notRequired(),
      // .test('is-objectid', 'Invalid Input GUID!', (inputGUID) => {
      //   if (!inputGUID || inputGUID == "null")
      //     return true;
      //   return ObjectId.isValid(inputGUID);
      // })
      // .when([], {
      //   is: () => isNewRequest,
      //   then: (schema) => schema.required(),
      //   otherwise: (schema) => schema.nullable().notRequired(),
      // }),

    machine: Yup.string().label('Machine')
      .test('is-objectid', 'Invalid Machine!', (machineId) => {
        if (!machineId || machineId == "null")
          return true;
        return ObjectId.isValid(machineId);
      }).nullable().notRequired(),

    configuration: Yup.mixed().label("Configuration").when([], {
      is: () => isNewRequest,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema,
    }),

    backupid: Yup.mixed().label("Backup Id").nullable().notRequired(),

    backupDate: Yup.mixed().label("Backup Date").nullable().notRequired(),

    isManufacture: Yup.boolean().label("Is Manufacture").nullable().notRequired(),
    isActive: Yup.boolean().label("Active").nullable().notRequired(),
    isArchived: Yup.boolean().label("Archived").nullable().notRequired(),
    archivedByMachine: Yup.boolean().label("Archived by machine").nullable().notRequired(),
  });
};

module.exports = {
  productConfigurationSchema
};
