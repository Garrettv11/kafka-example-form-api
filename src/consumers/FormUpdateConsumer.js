const kafka = require('kafka-node');
const Promise = require('bluebird');
const FormDao = require(__dirname + '/../dao/Form.js');
const ElasticSearchDao = require(__dirname + '/../dao/ElasticSearch.js');
const TOPIC_FORM_EDIT = 'FormEdit';
const config = require(__dirname + '/../../config.js');
const crypto = require('crypto');

// TODO: put this function in a central location for other parts of the code to reference
/**
* @description Creates a version hash for a form
* @param {String} formContents - The form contents
* @return {String} - sha1 hash
*/
const makeRevisionHash = formContents => {
  return crypto
    .createHash('sha1')
    .update(formContents)
    .digest('hex');
};
/**
 * @classdesc Form Update Consumer that pushes updates to Kafka.
 * @class
 */
class FormUpdateConsumer {
  /**
  * Create FormUpdateConsumer.
  * @constructor
  * @param {String} kafkaHost - address of kafka server
  */
  constructor(kafkaHost) {
    const client = new kafka.KafkaClient({kafkaHost});
    const Consumer = kafka.Consumer;
    this.consumer = Promise.promisifyAll(new Consumer(
      client,
      [ { topic: TOPIC_FORM_EDIT } ],
      {
        autoCommit: false,
      },
    ));

    this.consumer.on('message', async message => {
      console.log('the message being processed is :', JSON.stringify(message));
      try {
        const formToSave = JSON.parse(message.value);
        const formToSaveWithoutMeta = JSON.parse(message.value);
        delete formToSaveWithoutMeta.metadata;
        // we need to get the current version of the form
        const s3Key = formToSave.metadata.formUuid + '.json';
        const latestFormData = await FormDao.s3GetObject(config.aws.bucket, s3Key);
        let latestForm = latestFormData.Body.toString('utf-8');
        if (typeof latestForm !== 'object') latestForm = JSON.parse(latestForm);
        const latestFormVersion = latestFormData.VersionId;
        const formToSaveRevisionHash = makeRevisionHash(formToSaveWithoutMeta);
        console.log('the latest form version is : ', latestFormVersion);
        console.log('form to save revision hash is :', formToSaveRevisionHash);
        console.log('latest version revision hash is :', latestForm.metadata.revisonHash);

        if (formToSaveRevisionHash === latestForm.metadata.revisonHash) {
          console.log('+++++ processing update for the second time');
          // the two forms have the same content, we could have failed to finish the save routine before
          // resend the latest form to ES
          await ElasticSearchDao.updateDocumentWithIdInIndex('form', latestForm.metadata.formUuid, latestForm);
        }
        else {
          console.log('the version that we are saving off of is', formToSave.metadata.versionId);
          // there is a difference between the forms
          if (latestFormVersion !== formToSave.metadata.versionId) {
            // this edit was based on an old version and the user needs to 'pull'
            console.log('EDIT BASED ON OLD VERSION. REJECTING UPDATE!');
            // TODO: send socket message out to notify user of rejection
          }
          else {
            console.log('+++++ fresh update');
            // this is a good update push it to S3
            await FormDao.s3PutObject(config.aws.bucket, s3Key, formToSave);
            await ElasticSearchDao.updateDocumentWithIdInIndex('form', formToSave.metadata.formUuid, formToSave);
          }
          // await this.consumer.commit();
        }
      }
      catch (error) {
        console.log('error updating form:', error);
        throw error;
      }
    });

    this.consumer.on('error', err => {
      console.log('Form Update Producer error is :', err);
      throw err;
    });
  }
}

module.exports = FormUpdateConsumer;
