const uuidv4 = require('uuid/v4');
// const config = require(__dirname + '/../../config.js');
const { FormVersion, FormDefaultAuthor } = require(__dirname + '/../models/Form.js');
const crypto = require('crypto');
const FormDao = require(__dirname + '/../dao/Form.js');
const config = require(__dirname + '/../../config.js');

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
/*
 * PUBLIC METHODS
 */

module.exports = {};

/**
* @description finds the Form instance with the given id
* @param {Number} formUuid - uuid of Form instance
* @param {Object} request - Hapi Request interface
* @return {Promise}
*/
module.exports.findById = async (formUuid, request) => {
  console.log('+++ find by id');
  const s3Key = formUuid + '.json';
  const data = await FormDao.s3GetObject(config.aws.bucket, s3Key);
  let form = data.Body.toString('utf-8');
  if (typeof form !== 'object') form = JSON.parse(form);
  form.metadata.versionId = data.VersionId;
  console.log('my form is :', form);
  return form;
};

/**
 * @description Creates a new object with given data
 * @param {Object} form - form to submit
 * @param {Object} request - Hapi Request interface
 * @return {Promise}
 */
module.exports.create = async (form, request) => {

  // Check that form is an object. This will be taken care of with future Joi validation

  const formUuid = uuidv4();

  form.metadata = {
    formUuid: formUuid,
    schema: FormVersion,
    author: FormDefaultAuthor, // TODO: add identity from JWT claim when we have auth
    timestamp: new Date().toISOString(),
    revisionHash: makeRevisionHash(JSON.stringify(form)),
  };
  // now I want to submit this to kafka
  await request.server.app.formProducer.createForm(form);

};
