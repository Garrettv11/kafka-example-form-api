const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const { version, name: appName } = require(__dirname + '/../../package');
const noraCorrelationId = require('nora-correlation-id-plugin');
const db = require('nora-mysql-plugin');
const noraLogger = require('nora-logger-plugin');
const config = require(__dirname + '/../../config.js');
const { env } = config;

const plugins = [
  Inert,
  Vision,
  {
    plugin: HapiSwagger,
    options: {
      info: {
        title: 'Hapi Starter Kit API Documentation',
        version,
      },
    },
  },
  { plugin: noraCorrelationId, options: { env, appName } },
  { plugin: db.mysql, options: config.starterKitDB },
  { plugin: noraLogger.logging, options: { ...config, appName } },
  { plugin: noraLogger.listeners, options: { ...config, appName } },
];

module.exports = plugins;
