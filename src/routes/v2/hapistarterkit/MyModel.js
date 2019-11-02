const Boom = require('@hapi/boom');
const { MyModel, MyModelResponse } = require(__dirname + '/../../../models/MyModel.js');
const MyModelController = require(__dirname + '/../../../controllers/MyModel.js');
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
    method: 'GET',
    path: `/${apiVersion}/${svcName}/MyModels/{id}`,
    options: {
      tags: ['api'],
      description: 'Get the MyModel that has the supplied id.',
      validate: {
        params: {
          id: Joi.number().integer().description('id of MyModel instance to get'),
        },
        options: { presence: 'required' },
        failAction: failAction('request'),
      },
      response: {
        status: {
          200: MyModelResponse,
          403: Joi.any(),
          404: Joi.any(),
        },
        failAction: failAction('response'),
      },
      auth: false,
    },
    handler: async (request, h) => {
      const id = request.params.id;
      return await MyModelController.findById(id, request);
    },
  },
  {
    method: 'POST',
    path: `/${apiVersion}/${svcName}/MyModels`,
    options: {
      tags: ['api'],
      description: 'Create a MyModel',
      validate: {
        payload: MyModel,
        options: { presence: 'required' },
        failAction: failAction('request'),
      },
      response: {
        status: {
          200: Joi.number().integer().description('id of newly created MyModel'),
          400: Joi.any(),
        },
        failAction: failAction('response'),
      },
      auth: false,
    },
    handler: async (request, h) => {
      return await MyModelController.create(request.payload, request);
    },
  },

];
