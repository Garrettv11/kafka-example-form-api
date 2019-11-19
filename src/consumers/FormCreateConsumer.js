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
    this.isReady = false;

    this.consumer.on('message', async message => {
      console.log('the message being processed is :', JSON.stringify(message));
      // try to store the form in S3
      const form = JSON.parse(message.value);
      try {
        await FormDao.s3PutObject(config.aws.bucket, form.name + '.json', form);
        await ElasticSearchDao.addDocumentWithIdToIndex('form', form.metadata.formUuid, form);
      }
      catch (error) {
        console.log('error processing form:', error);
        throw error;
      }
      // TODO: write search details to Elastic Search
      // if everything goes right, commit
    });

    this.consumer.on('error', err => {
      console.log('Form Producer error is :', err);
      throw err;
    });
  }
}

module.exports = FormCreateConsumer;
