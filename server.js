const Hapi = require('@hapi/hapi');
const healthcheckRoute = require(__dirname + '/src/routes/version.js');
const formRoutes = require(__dirname + '/src/routes/v2/studio/Form.js');
const plugins = require(__dirname + '/src/plugins/plugins.js');
const config = require(__dirname + '/config.js');
const FormProducer = require(__dirname + '/src/producers/FormProducer.js');
const AuditLogProducer = require(__dirname + '/src/consumers/AuditLogProducer.js');
const FormCreateConsumer = require(__dirname + '/src/consumers/FormCreateConsumer.js');
const FormUpdateConsumer = require(__dirname + '/src/consumers/FormUpdateConsumer.js');

/**
* @description registers server plugins and starts a hapi server
* @return {Object} returns the started hapi server
*/
const start = async () => {
  const server = await new Hapi.Server(config.hapiOptions);
  try {
    // register plugins
    await server.register(plugins);
    // add routes
    server.route(healthcheckRoute);
    server.route(formRoutes);
    server.app.formProducer = new FormProducer(config.kafkaServer);
    const auditLogProducer = new AuditLogProducer(config.kafkaServer);
    server.app.auditLogProducer = auditLogProducer;
    server.app.formCreateConsumer = new FormCreateConsumer(config.kafkaServer, auditLogProducer);
    server.app.formUpdateConsumer = new FormUpdateConsumer(config.kafkaServer, auditLogProducer);
    await server.start();
    console.log('Server running at:', server.info.uri);
    console.log('Swagger definition available at:', server.info.uri + '/swagger.json');
    return server;
  }
  catch (err) {
    console.log(err);
  }
};

if (!module.parent) start();

module.exports = { start };
