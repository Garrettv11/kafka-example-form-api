
const Joi = require('@hapi/joi');

// AuditLogEntry
const AuditLogEntry = Joi.object().keys({
  object: Joi.string().required()
    .description('The kind of object modified'),
  objectId: Joi.string().required()
    .description('Id of the object modified'),
  author: Joi.string().required()
    .description('Name of the person who changed the item'),
  timestamp: Joi.date().iso().required()
    .description('date and time the change occurred'),
})
  .description('Audit Log Entry')
  .label('AuditLogEntry');

module.exports = AuditLogEntry;
