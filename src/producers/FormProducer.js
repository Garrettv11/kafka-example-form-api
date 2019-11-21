const kafka = require('kafka-node');
const KeyedMessage = kafka.KeyedMessage;
const Promise = require('bluebird');
const TOPIC_FORM_CREATE = 'FormCreate';
const TOPIC_FORM_EDIT = 'FormEdit';

// TODO: might want to split this off to a high level producer for creates since it doesn't depend on a partition

/**
 * @classdesc Form Producer that pushes updates to Kafka.
 * @class
 */
class FormProducer {
  /**
  * Create FormProducer.
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
  * @description Creates a form.
  * @param {Object} form - form to create
  */
  async createForm(form) {
    const createFormKM = new KeyedMessage(form.metadata.formUuid, JSON.stringify(form));
    const payloads = [
      { topic: TOPIC_FORM_CREATE, messages: createFormKM },
    ];
    if (this.isReady) {
      await this.producer.sendAsync(payloads);
    }
    else {
      // the exception handling can be improved, for example schedule this message to be tried again later on
      console.error('sorry, FormProducer is not ready yet, failed to produce message to Kafka.');
    }
  }
  /**
  * @description Updates a form.
  * @param {Object} form - form to create
  */
  async updateForm(form) {
    console.log('PRODUCER CALLING UPDATE FORM');
    const updateFormKM = new KeyedMessage(form.metadata.formUuid, JSON.stringify(form));
    const payloads = [
      { topic: TOPIC_FORM_EDIT, messages: updateFormKM, partition: form.metadata.formUuid },
    ];
    if (this.isReady) {
      try {
        console.log('sending the payload for update');
        await this.producer.sendAsync(payloads);
        console.log('SENT the payload for update');
      }
      catch (error) {
        console.log('kafka commit error in form producer is :', error);
        throw error;
      }

    }
    else {
      // the exception handling can be improved, for example schedule this message to be tried again later on
      console.error('sorry, FormProducer is not ready yet, failed to produce message to Kafka.');
      throw new Error('FormProducer not yet ready');
    }
  }
}

module.exports = FormProducer;
