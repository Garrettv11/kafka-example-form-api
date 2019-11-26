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
  * @param {AuditLogProducer} auditLogProducer - producer used to write to audit log topic
  */
  constructor(kafkaHost, auditLogProducer) {
    const client = new kafka.KafkaClient({kafkaHost});
    const Consumer = kafka.Consumer;
    this.auditLogProducer = auditLogProducer;
    this.consumer = Promise.promisifyAll(new Consumer(
      client,
      [ { topic: TOPIC_FORM_EDIT } ],
      {
        autoCommit: false,
      },
    ));

    this.consumer.on('message', async message => {

      try {
        const formToSave = JSON.parse(message.value);
        const bodyToSave = JSON.parse(message.value);
        delete bodyToSave.metadata;
        // we need to get the current version of the form
        const s3Key = formToSave.metadata.formUuid + '.json';
        const latestFormData = await FormDao.s3GetObject(config.aws.bucket, s3Key);
        let latestForm = latestFormData.Body.toString('utf-8');
        if (typeof latestForm !== 'object') latestForm = JSON.parse(latestForm);
        let latestFormBody = latestFormData.Body.toString('utf-8');
        if (typeof latestFormBody !== 'object') latestFormBody = JSON.parse(latestFormBody);
        delete latestFormBody.metadata;

        const formToSaveRevisionHash = makeRevisionHash(JSON.stringify(bodyToSave));
        const latestFormRevisionHash = makeRevisionHash(JSON.stringify(latestFormBody));

        if (formToSaveRevisionHash === latestFormRevisionHash) {
          console.log('+++++ processing update for the second time');
          // the two forms have the same content, we could have failed to finish the save routine before
          // resend the latest form to ES
          await ElasticSearchDao.updateDocumentWithIdInIndex('form', latestForm.metadata.formUuid, latestForm);
        }
        else {
          console.log('the version that we are saving off of is', formToSave.metadata.versionId);
          // there is a difference between the forms
          console.log('latest form versionid is :', latestFormData.VersionId);
          console.log('form to save versionid is :', formToSave.metadata.versionId);
          if (latestFormData.VersionId !== formToSave.metadata.versionId) {
            // this edit was based on an old version and the user needs to 'pull'
            console.log('EDIT BASED ON OLD VERSION. REJECTING UPDATE!');
            // TODO: send socket message out to notify user of rejection
          }
          else {
            console.log('+++++ fresh update');
            // this is a good update push it to S3
            // remove metadata versionId because it currently doesn't exist in our model for a saved form :(
            // TODO: figure out what to do about this ^
            delete formToSave.metadata.versionId;
            await FormDao.s3PutObject(config.aws.bucket, s3Key, formToSave);
            await ElasticSearchDao.updateDocumentWithIdInIndex('form', formToSave.metadata.formUuid, formToSave);
          }
        }
        // need to get the revision before
        const revisionHistory = await FormDao.s3ObjectVersions(config.aws.bucket, s3Key);
        const versions = revisionHistory.Versions;
        let previousVersionId;
        for (const i in versions) {
          const version = versions[i];
          if (!version.IsLatest) {
            previousVersionId = version.VersionId;
            break;
          }
        }
        const oldVersionData = await FormDao.s3GetObject(config.aws.bucket, s3Key, previousVersionId);
        let oldVersionForm = oldVersionData.Body.toString('utf-8');
        if (typeof oldVersionForm !== 'object') oldVersionForm = JSON.parse(oldVersionForm);
        console.log('old version form is :', oldVersionForm);
        await this.auditLogProducer.createAuditLog(
          'Form',
          formToSave.metadata.formUuid,
          formToSave.metadata.author,
          formToSave.metadata.timestamp,
          latestForm,
          latestFormData.VersionId,
          oldVersionForm,
          previousVersionId,
        );

        return await this.consumer.commitAsync();
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
