const kafka = require('kafka-node');
const KeyedMessage = kafka.KeyedMessage
const Promise = require('bluebird');
const TOPIC_FORM_CREATE = 'Form-Create';
const TOPIC_FORM_EDIT = 'Form-Edit';
class FormProducer {
  /**
  * Create S3NORA SDK.
  * @constructor
  * @param String kafkaServer - address of kafka server
  */
  constructor(kafkaServer) {
    const Producer = kafka.Producer;
    const client = new kafka.Client(kafkaServer);
    this.producer = Promise.promisifyAll(new Producer(client));
    this.isReady = false;
    
    this.producer.on('ready', async function() {
      console.log('Form producer is operational');
      this.isReady = true;
    });
    
    this.producer.on('error', function(err) {
      console.log('Form Producer error is :', err);
      throw err;
    });
  }

  async createForm(form) {
    const createFormKM = new KeyedMessage(form.metaData.formUuid, JSON.stringify(form)),
    payloads = [
        { topic: TOPIC_FORM_CREATE, messages: createFormKM},
    ];
    if (this.isReady) {
      await this.producer.sendAsync(payloads);
    } else {
        // the exception handling can be improved, for example schedule this message to be tried again later on
        console.error("sorry, FormProducer is not ready yet, failed to produce message to Kafka.");
    }
  };

  async updateForm(form) {
    const createFormKM = new KeyedMessage(form.metaData.formUuid, JSON.stringify(form)),
    payloads = [
        { topic: TOPIC_FORM_EDIT, messages: createFormKM, partition: form.metaData.formUuid},
    ];
    if (this.isReady) {
      await this.producer.sendAsync(payloads);
    } else {
      // the exception handling can be improved, for example schedule this message to be tried again later on
      console.error("sorry, FormProducer is not ready yet, failed to produce message to Kafka.");
      throw new Error('FormProducer not yet ready');
    }
  };

}