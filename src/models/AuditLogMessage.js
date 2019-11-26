
const Joi = require('@hapi/joi');

// AuditLogEntry
const AuditLogMessage = Joi.object().keys({
  recordType: Joi.string().required()
    .description('The kind of object modified'),
  recordId: Joi.string().required()
    .description('Id of the object modified'),
  author: Joi.string().required()
    .description('Name of the person who changed the item'),
  timestamp: Joi.date().iso().required()
    .description('date and time the change occurred'),
  newRecord: Joi.object().required()
    .description('the new state of the record'),
  newRecordVersionId: Joi.string().required()
    .description('versionId of the newly modified record'),
  oldRecord: Joi.object().optional()
    .description('The old state of the record. Not present if the record is being newly created'),
  oldRecordVersionId: Joi.string().optional()
    .description('versionId of the old record'),
  isPartialUpdate: Joi.boolean().optional()
    .description('date and time the change occurred'),
})
  .description('Audit Log Message ')
  .label('AuditLogMessage');

module.exports = AuditLogMessage;
