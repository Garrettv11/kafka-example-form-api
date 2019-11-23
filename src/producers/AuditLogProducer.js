const kafka = require('kafka-node');
const KeyedMessage = kafka.KeyedMessage;
const Promise = require('bluebird');
const AuditLogModel = require(__dirname + '/../models/AuditLog.js');
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
      console.log('Form producer is operational');
      this.isReady = true;
    });

    this.producer.on('error', err => {
      console.log('Form Producer error is :', err);
      throw err;
    });
  }
  /**
  * @description Creates an audit log.
  * @param {String} objectType - type of object being logged as changed
  * @param {String} objectId - unique identifier of the object changed
  * @param {String} author - entity that made the change
  * @param {Date} timestamp - timestamp describing when the change was made
  */
  async createAuditLog(objectType, objectId, author, timestamp) {
    const auditEntry = {
      object: objectType,
      objectId,
      author,
      timestamp,
    };
    // validate this against our model
    const validationResult = AuditLogModel.validate();
    if (validationResult.error) {
      const error = new Error(`invalid audit log structure: ${validationResult.error}`);
      throw error;
    }
    const partitionKey = objectType + '-' + objectId;
    const createAuditEntryKM = new KeyedMessage(partitionKey, JSON.stringify(auditEntry));
    const payloads = [
      { topic: TOPIC_AUDITLOG_CREATE, messages: createAuditEntryKM },
    ];
    if (this.isReady) {
      await this.producer.sendAsync(payloads);
    }
    else {
      // the exception handling can be improved, for example schedule this message to be tried again later on
      console.error('sorry, FormProducer is not ready yet, failed to produce message to Kafka.');
    }
  }
}

module.exports = AuditLogProducer;
