
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
  oldRecord: Joi.object().optional()
    .description('The old state of the record. Not present if the record is being newly created'),
  isPartialUpdate: Joi.date().iso().required()
    .description('date and time the change occurred'),
})
  .description('Audit Log Message ')
  .label('AuditLogMessage');

module.exports = AuditLogMessage;
