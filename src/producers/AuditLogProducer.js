const kafka = require('kafka-node');
const KeyedMessage = kafka.KeyedMessage;
const Promise = require('bluebird');
const AuditLogMessage = require(__dirname + '/../models/AuditLogMessage.js');
const TOPIC_AUDITLOG_CREATE = 'AuditLogCreate';

/**
 * @classdesc Audit Log Producer that pushes updates to Kafka.
 * @class
 */
class AuditLogProducer {
  /**
  * Create AuditLogProducer.
  * @constructor
  * @param {String} kafkaHost - address of kafka server
  */
  constructor(kafkaHost) {
    const client = new kafka.KafkaClient({kafkaHost});
    const Producer = kafka.Producer;
    this.producer = Promise.promisifyAll(new Producer(client));
    this.isReady = false;

    this.producer.on('ready', async () => {
      console.log('AuditLog producer is operational');
      this.isReady = true;
    });

    this.producer.on('error', err => {
      console.log('AuditLog Producer error is :', err);
      throw err;
    });
  }
  /**
  * @description Creates an audit log.
  * @param {String} recordType - type of object being logged as changed
  * @param {String} recordId - unique identifier of the object changed
  * @param {String} author - entity that made the change
  * @param {Date} timestamp - timestamp describing when the change was made
  * @param {Object} newRecord - object representing the new state of the object
  * @param {String} newRecordVersionId - version id of the new record
  * @param {Object} oldRecord - object representing the old state of the object
  * @param {String} oldRecordVersionId - version id of the old record
  * @param {Boolean} isPartialUpdate - true if this update is a PUT rather than a total replacement
  */
  async createAuditLog(
    recordType,
    recordId,
    author,
    timestamp,
    newRecord,
    newRecordVersionId,
    oldRecord = null,
    oldRecordVersionId = null,
    isPartialUpdate = false
  ) {
    const auditMessage = {
      recordType,
      recordId,
      author,
      timestamp,
      newRecord,
      newRecordVersionId,
      isPartialUpdate,
    };
    if (oldRecord) auditMessage.oldRecord = oldRecord;
    if (oldRecordVersionId) auditMessage.oldRecordVersionId = oldRecordVersionId;

    // validate this against our model
    const validationResult = AuditLogMessage.validate(auditMessage);
    if (validationResult.error) {
      const error = new Error(`invalid audit log structure: ${validationResult.error}`);
      throw error;
    }
    const partitionKey = recordType + '-' + recordId;
    const createAuditEntryKM = new KeyedMessage(partitionKey, JSON.stringify(auditMessage));
    const payloads = [
      { topic: TOPIC_AUDITLOG_CREATE, messages: createAuditEntryKM },
    ];
    if (this.isReady) {
      await this.producer.sendAsync(payloads);
    }
    else {
      // the exception handling can be improved, for example schedule this message to be tried again later on
      console.error('sorry, AuditLogProducer is not ready yet, failed to produce message to Kafka.');
    }
  }
}

module.exports = AuditLogProducer;
