const Joi = require('@hapi/joi');

const MyModel = Joi.object().keys({
  description: Joi.string()
    .description('Description of the example model'),
})
  .description('example model payload that would be used to create a new MyModel instance').label('MyModel');

const MyModelResponse = Joi.object().keys({
  id: Joi.number().integer().required()
    .description('ID of the example model'),
  description: Joi.string()
    .description('Description of the example model'),
})
  .description('example instance of MyModel with the unique ID present').label('MyModelResponse');


module.exports = { MyModel, MyModelResponse };
