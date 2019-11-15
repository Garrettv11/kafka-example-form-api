const uuidv4 = require('uuid/v4');
// const config = require(__dirname + '/../../config.js');
const { FormVersion, FormDefaultAuthor } = require(__dirname + '/../models/Form.js');
const crypto = require('crypto');

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
