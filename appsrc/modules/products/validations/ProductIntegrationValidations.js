const yup = require('yup');

const integrationDetailsSchema = yup.object({
  computerGUID: yup.string().max(50, 'Computer GUID must not exceed 50 characters'),
  IPC_SerialNo: yup.string().max(50, 'IPC Serial Number must not exceed 50 characters')
});

module.exports = {
  integrationDetailsSchema
};
