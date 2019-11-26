const kafka = require('kafka-node');
const Promise = require('bluebird');
const FormDao = require(__dirname + '/../dao/Form.js');
const ElasticSearchDao = require(__dirname + '/../dao/ElasticSearch.js');
const TOPIC_FORM_CREATE = 'FormCreate';
const config = require(__dirname + '/../../config.js');

/**
 * @classdesc Form Producer that pushes updates to Kafka.
 * @class
 */
class FormCreateConsumer {
  /**
  * Create FormCreateConsumer.
  * @constructor
  * @param {String} kafkaHost - address of kafka server
  * @param {AuditLogProducer} auditLogProducer - producer used to write to audit log topic
  */
  constructor(kafkaHost, auditLogProducer) {
    const client = new kafka.KafkaClient({kafkaHost});
    const Consumer = kafka.Consumer;
    this.auditLogProducer = auditLogProducer;
    this.consumer = Promise.promisifyAll(new Consumer(
      client,
      [ { topic: TOPIC_FORM_CREATE } ],
      {
        autoCommit: false,
      },
    ));

    this.consumer.on('message', async message => {
      console.log('the message being processed is :', JSON.stringify(message));
      // try to store the form in S3
      const form = JSON.parse(message.value);
      const s3Key = form.metadata.formUuid + '.json';
      try {
        // we need to make sure we didn't already put this form in
        console.log('checking to see if we already saved');
        const hasSavedFormAlready = await FormDao.s3ObjectExists(config.aws.bucket, form.name + '.json');
        console.log('++++ previouslySavedFormResult is :', hasSavedFormAlready);
        if (!hasSavedFormAlready) {
          await FormDao.s3PutObject(config.aws.bucket, s3Key, form);
        }
        // check to see if we already put this information in ElasticSearch
        const hasAddedFormToSearch = await ElasticSearchDao.doesDocumentExist('form', form.metadata.formUuid);
        console.log('has already added to elastic search? ', hasAddedFormToSearch);
        if (!hasAddedFormToSearch) {
          await ElasticSearchDao.addDocumentWithIdToIndex('form', form.metadata.formUuid, form);
        }
        // everything has been submitted - commit
        // TODO: send a socket message to notify user of success
        // we need to send the record to auditlog
        // get the latest version of the s3 record
        const data = await FormDao.s3GetObject(config.aws.bucket, s3Key);
        const versionId = data.VersionId;
        let latestForm = data.Body.toString('utf-8');
        if (typeof latestForm !== 'object') latestForm = JSON.parse(latestForm);
        await this.auditLogProducer.createAuditLog(
          'Form',
          latestForm.metadata.formUuid,
          latestForm.metadata.author,
          latestForm.metadata.timestamp,
          latestForm,
          versionId
        );
        await this.consumer.commitAsync();
      }
      catch (error) {
        console.log('error processing form:', error);
        throw error;
      }
    });

    this.consumer.on('error', err => {
      console.log('Form Create Producer error is :', err);
      throw err;
    });
  }
}

module.exports = FormCreateConsumer;
