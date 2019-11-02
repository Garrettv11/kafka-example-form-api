const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const { version, name: appName } = require(__dirname + '/../../package');
const noraCorrelationId = require('nora-correlation-id-plugin');
const env = process.env.NODE_ENV ? process.env.NODE_ENV: 'dev-docker';

const plugins = [
  Inert,
  Vision,
  {
    plugin: HapiSwagger,
    options: {
      info: {
        title: 'Form API Documentation',
        version,
      },
    },
  },
  { plugin: noraCorrelationId, options: { env, appName } },
];

module.exports = plugins;
