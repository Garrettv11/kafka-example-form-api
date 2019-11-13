
const Joi = require('@hapi/joi');
const FormDefaultAuthor = 'Form Service';

// Form
const FormMetaData = Joi.object().keys({
  formUuid: Joi.string().guid({version: 'uuidv4'}).required()
    .description('ID of the form'),
  schema: Joi.string().required()
    .description('Schema of the form, e.g. nora.science37.com/schema/form-v2'),
  author: Joi.string().required()
    .description('Name of the person who created the form'),
  timestamp: Joi.date().iso().required()
    .description('Date and time that the form was created'),
  versionId: Joi.string().required()
    .description('Object version from s3'),
  revisionHash: Joi.string().required()
    .description('cryptographic hash of form contents to prevent saving without changes'),
})
  .description('System generated metadata for the form object')
  .label('FormMetaData');

const Form = Joi.object().keys({
  name: Joi.string().required()
    .description('System (internal) name of the form, for use in Form Builder.'),
  sponsorVariable: Joi.string().allow(null).required()
    .description('Form variable chosen by sponsor.'),
  noraVariable: Joi.string().allow(null).required()
    .description('NORA standard variable used for analytics and reporting.'),
  workflow: Joi.string().required()
    .description('Predefined workflow to categorize the form for business use type, e.g. "Patient Note".'),
})
  .description('Form Entity')
  .label('Form');

const FormGetResponse = Form.append({ metadata: FormMetaData.required() })
  .label('FormGetResponse')
  .description('Form response with unique ID present');

module.exports = {
  // Form
  Form,
  FormMetaData,
  FormDefaultAuthor,

  // Requests and Responses
  FormGetResponse,
};
