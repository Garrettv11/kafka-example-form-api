const Wreck = require('@hapi/wreck');
const Joi = require('@hapi/joi');

// Get api version for this route from the directory name
const pathParts = __dirname.match(/routes\/(v\d+)\/([^/]+)/);
const apiVersion = pathParts[1];
const svcName = pathParts[2];

const CORRELATION_ID = 's37-correlation-id';

/** *
 * This is an example of passing the correlationId to downstream internal services
 * using Wreck.  THIS IS NOT AN EXAMPLE OF GOOD API!
 *
 * Endpoints:
 *
 * loop/internal is an endpoint that gets called by the two other endpoints
 * loop/good is an endpoint that calls loop/internal passing the correlationId
 * loop/bad is an endpoint that calls loop/internal but does not pass the correlationId
 */
module.exports = [
  {
    method: 'GET',
    path: `/${apiVersion}/${svcName}/loops/good`,
    options: {
      description: '"Edge" webservice',
      response: {
        status: {
          200: Joi.any(),
        },
      },
      auth: false,
    },
    handler: async (request, h) => {
      request.log('info', 'Loop good is called');
      const { uri: root } = request.server.info;
      const uri = `${root}/v2/hapistarterkit/loops/internal`;
      await Wreck.get(uri, { headers: { [CORRELATION_ID]: request.correlationId } });
      request.log('info', 'Successfullying called loop internal from loop good');
      return { message: 'Good Job!' };
    },
  },
  {
    method: 'GET',
    path: `/${apiVersion}/${svcName}/loops/bad`,
    options: {
      description: '"Edge" webservice',
      response: {
        status: {
          200: Joi.any(),
        },
      },
      auth: false,
    },
    handler: async (request, h) => {
      request.log('info', 'Loop bad is called');
      const { uri: root } = request.server.info;
      const uri = `${root}/v2/hapistarterkit/loops/internal`;
      // BAD!! Please pass the 's27-correlation-id'!!!
      await Wreck.get(uri);
      request.log('info', 'Successfullying called loop internal from loop bad');
      return { message: 'What the #@$A#$ are you doing?' };
    },
  },
  {
    method: 'GET',
    path: `/${apiVersion}/${svcName}/loops/internal`,
    options: {
      description: 'Internal webservice example',
      response: {
        status: {
          200: Joi.any(),
        },
      },
      auth: false,
    },
    handler: async (request, h) => {
      request.log('info', 'Loop two is called');
      const { uri } = request.server.info;
      return { uri, path: request.path };
    },
  },
];
