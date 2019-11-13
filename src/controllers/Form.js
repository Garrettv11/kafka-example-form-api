const FormDao = require(__dirname + '/../dao/Form.js');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const uuidv4 = require('uuid/v4');
const config = require(__dirname + '/../../config.js');
const { FormVersion, FormDefaultAuthor } = require(__dirname + '/../models/Form.js');
const crypto = require('crypto');

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
  // TODO: implement
  return null;
};

/**
   * @description Retrieves a ordered, paginated list of objects
   * @param {Object} page - Page parameters
   * @param {Object} request - Hapi Request interface
   * @return {Promise} A page object containing the list of objects and set of cursors
   */
module.exports.find = async (page, request) => {
  // TODO implement
};

/**
 * @description Creates a new object with given data
 * @param {Object} FormLocation - new object definition
 * @param {Object} request - Hapi Request interface
 * @return {Promise}
 */
module.exports.create = async (FormLocation, request) => {
  const { trialUuid, form } = FormLocation;

  // Check that form is an object. This will be taken care of with future Joi validation
  if (typeof form !== 'object') throw Boom.badRequest('Contents of form must be an object');
  let { formUuid } = FormLocation;
  if (!formUuid) formUuid = uuidv4();
  const filename = `${formUuid}.json`;
  const s3Bucket = config.aws.s3.bucket;
  const s3Key = `trials/${trialUuid}/forms/${filename}`;

  form.metadata = {
    formUuid: formUuid,
    schema: FormVersion,
    author: FormDefaultAuthor, // TODO: add identity from JWT claim when we have auth
    timestamp: new Date().toISOString(),
    revisionHash: makeRevisionHash(JSON.stringify(form)),
  };

  await FormDao.s3PutObject(s3Bucket, s3Key, form, request);
  const locationDetails = [trialUuid, formUuid, form.name, s3Bucket, s3Key];

  try {
    const returnUuid = await FormDao.create(formUuid, locationDetails, request);
    request.log(['s3', 'forms', 'debug'], {
      message: 'Successfully inserted into FormLocation.',
    });
    return { formUuid: returnUuid };
  }
  catch (err) {
    const error = new Error(`Unable to insert into FormLocation: ${JSON.stringify(err.message)}`);
    request.log(['s3', 'forms', 'error'], error);
    await FormDao.s3DeleteObject(s3Bucket, s3Key, request);
    throw error;
  }
};
