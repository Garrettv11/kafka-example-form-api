const Boom = require('@hapi/boom');
const {
  Form,
  FormGetResponse,
}
  = require(__dirname + '/../../../models/Form.js');
const FormController = require(__dirname + '/../../../controllers/Form.js');
const Joi = require('@hapi/joi');

// Get api version for this route from the directory name
const pathParts = __dirname.match(/routes\/(v\d+)\/([^/]+)/);
const apiVersion = pathParts[1];
const svcName = pathParts[2];
/**
 * @description Universal hapi failAction function for validation requests
 * @param {string} type - type of validation -- 'request' or 'response'
 * @return {function} failAction lifecycle function
 */
const failAction = type => async (request, h, err) => {
  request.log(err);
  return type === 'request' ?
    Boom.badRequest(`Invalid request payload input: ${err.message}`) :
    Boom.badImplementation(`Invalid response payload output`);
};

module.exports = [
  {
    method: 'POST',
    path: `/${apiVersion}/${svcName}/forms`,
    options: {
      tags: ['api'],
      description: 'Create a form template object instance.',
      validate: {
        payload: Form,
        failAction: failAction('request'),
      },
      response: {
        status: {
          201: Joi.any(),
          400: Joi.any(),
          403: Joi.any(),
        },
        failAction: failAction('response'),
      },
      log: { collect: true },
      auth: false,
    },
    handler: async (request, h) => {
      await FormController.create(request.payload, request);
      return h.response().code(200);
    },
  },
  {
    method: 'GET',
    path: `/${apiVersion}/${svcName}/forms/{formUuid}`,
    options: {
      tags: ['api'],
      description: 'Get the form that has the supplied uuid.',
      validate: {
        params: {
          formUuid: Joi.string().guid({version: 'uuidv4'})
            .description('ID of the form'),
        },
        failAction: failAction('request'),
      },
      response: {
        status: {
          200: FormGetResponse,
          400: Joi.any(),
          403: Joi.any(),
          404: Joi.any(),
        },
        failAction: failAction('response'),
      },
      log: { collect: true },
      auth: false,
    },
    handler: async (request, h) => {
      const formUuid = request.params.formUuid;
      return await FormController.findById(formUuid, request);
    },
  },
  //   {
  //     method: 'GET',
  //     path: `/${apiVersion}/${svcName}/forms`,
  //     options: {
  //       tags: ['api'],
  //       description: 'Get a filterable list of forms. Returns the latest version for each form.',
  //       validate: {
  //         query: getPageQuery(['title'])
  //           // Append Form filtering query params
  //           .append({ query: FormQuery}),
  //         failAction: failAction('request'),
  //       },
  //       response: {
  //         status: {
  //           200: getPageModel(FormGetAllResponse),
  //           403: Joi.any(),
  //           404: Joi.any(),
  //         },
  //         failAction: failAction('response'),
  //       },
  //       log: { collect: true },
  //       auth: false,
  //     },
  //     handler: async (request, h) => {
  //       return await FormController.find(request.query, request);
  //     },
  //   },
  //   {
  //     method: 'PUT',
  //     path: `/${apiVersion}/${svcName}/forms/{formUuid}`,
  //     options: {
  //       tags: ['api'],
  //       description: 'Update a form by the supplied uuid.',
  //       validate: {
  //         params: {
  //           formUuid: FormLocationProperties.formUuid,
  //         },
  //         payload: Form,
  //         failAction: failAction('request'),
  //       },
  //       pre: FormController.FormGuardrails,
  //       response: {
  //         status: {
  //           200: FormUpdateResponse,
  //           400: Joi.any(),
  //           403: Joi.any(),
  //           404: Joi.any(),
  //         },
  //         failAction: failAction('response'),
  //       },
  //       log: { collect: true },
  //       auth: false,
  //     },
  //     handler: async (request, h) => {
  //       const formUuid = request.params.formUuid;
  //       return await FormController.update(formUuid, request.payload, request);
  //     },
  //   },
  //   {
  //     method: 'DELETE',
  //     path: `/${apiVersion}/${svcName}/forms/{formUuid}`,
  //     options: {
  //       tags: ['api'],
  //       description: 'Delete the form that has the supplied uuid.',
  //       validate: {
  //         params: {
  //           formUuid: FormLocationProperties.formUuid,
  //         },
  //         failAction: failAction('request'),
  //       },
  //       response: {
  //         status: {
  //           200: Joi.any().empty(),
  //           400: Joi.any(),
  //           403: Joi.any(),
  //           404: Joi.any(),
  //         },
  //         failAction: failAction('response'),
  //       },
  //       log: { collect: true },
  //       auth: false,
  //     },
  //     handler: async (request, h) => {
  //       const formUuid = request.params.formUuid;
  //       return await FormController.delete(formUuid, request);
  //     },
  //   },

];
