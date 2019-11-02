const Joi = require('@hapi/joi');
const { MyModelResponse } = require(__dirname + '/../../src/models/MyModel.js');
const MyModelDao = require(__dirname + '/../../src/dao/MyModel.js');
const MyModelController = require(__dirname + '/../../src/controllers/MyModel.js');
const Faker = require('faker');
const sinon = require('sinon');
const sinonTest = require('sinon-test')(sinon);

beforeAll(async () => {
  // setup before each test
});

describe('Test availability of private methods to unit tests', () => {
  test('example private method should be available', async () => {
    const privateMethodReturnValue = MyModelController._private_.examplePrivateMethod();
    expect(privateMethodReturnValue).toBe(true);
  });

});

describe('Test basic CRUD-like operations', () => {
  test('It should create a MyModel instance', sinonTest(async () => {
    const id = Faker.random.number();
    const description = Faker.lorem.sentence();
    const request = { log: () => {} };
    sinon.stub(MyModelDao, 'create').returns(id);
    const insertId = await MyModelController.create({
      description,
    }, request );
    expect(insertId).toEqual(id);
  }));

  test('It should find a MyModel instance', sinonTest(async () => {
    const id = Faker.random.number();
    const description = Faker.lorem.sentence();
    sinon.stub(MyModelDao, 'findById').returns({id, description});
    const myModelInstance = await MyModelController.findById(id);
    expect(Joi.validate(myModelInstance, MyModelResponse).error).toBe(null);
    expect(myModelInstance.id).toEqual(id);
    expect(myModelInstance.description).toEqual(description);
  }));

});
