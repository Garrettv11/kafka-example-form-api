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
  */
  constructor(kafkaHost) {
    const client = new kafka.KafkaClient({kafkaHost});
    const Consumer = kafka.Consumer;
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
      try {
        // we need to make sure we didn't already put this form in
        console.log('checking to see if we already saved');
        const hasSavedFormAlready = await FormDao.s3ObjectExists(config.aws.bucket, form.name + '.json');
        console.log('++++ previouslySavedFormResult is :', hasSavedFormAlready);
        if (!hasSavedFormAlready) {
          await FormDao.s3PutObject(config.aws.bucket, form.metadata.formUuid + '.json', form);
        }
        // check to see if we already put this information in ElasticSearch
        const hasAddedFormToSearch = await ElasticSearchDao.doesDocumentExist('form', form.metadata.formUuid);
        console.log('has already added to elastic search? ', hasAddedFormToSearch);
        if (!hasAddedFormToSearch) {
          await ElasticSearchDao.addDocumentWithIdToIndex('form', form.metadata.formUuid, form);
        }
        // everything has been submitted - commit
        // TODO: send a socket message to notify user of success
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
