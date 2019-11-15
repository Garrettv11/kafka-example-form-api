'use strict';
const aws = require('aws-sdk');
const config = require(__dirname + '/../../config.js');
const credentials = {
  accessKeyId: 'bla',
  secretAccessKey: 'bla',
};
const s3 = new aws.S3({credentials, apiVersion: '2006-03-01', s3ForcePathStyle: true, endpoint: config.aws.endpoint});

module.exports = {
  /**
  * @description Gets form object from S3 bucket
  * @param {String} s3Bucket - Bucket where form is located
  * @param {String} s3Key - Name assigned to the object, used to locate the object in bucket
  * @return {Promise}
  */
  s3GetObject: async (s3Bucket, s3Key) => {
    const s3Params = {
      Bucket: s3Bucket,
      Key: s3Key,
    };
    try {
      const data = await s3.getObject(s3Params).promise();
      return data;
    }
    catch (err) {
      const error = new Error(`Unable to get object from S3: ${JSON.stringify(err.message)}`);
      throw error;
    }

  },

  /**
  * @description Creates or updates form in S3 bucket
  * @param {String} s3Bucket - Bucket where form is located
  * @param {String} s3Key - Name assigned to the object, used to locate the object in bucket
  * @param {Object} Form - Object to be saved
  * @return {Promise}
  */
  s3PutObject: async (s3Bucket, s3Key, Form) => {
    const s3Params = {
      Bucket: s3Bucket,
      Key: s3Key,
      Body: JSON.stringify(Form),
      ContentEncoding: 'application/json',
    };
    console.log('my s3 params are : ', JSON.stringify(s3Params));
    try {
      const s3Response = await s3.putObject(s3Params).promise();
      const response = {
        versionId: s3Response.VersionId,
        timestamp: new Date(),
      };
      return response;
    }
    catch (err) {
      const error = new Error(`Unable to update object in S3: ${JSON.stringify(err.message)}`);
      throw error;
    }
  },

  /**
  * @description Deletes object from S3 bucket
  * @param {String} s3Bucket - Bucket where form is located
  * @param {String} s3Key - Name assigned to the object, used to locate the object in bucket
  * @param {Object} request - Hapi Request interface
  * @return {Object} response of deleting object from S3
  */
  s3DeleteObject: async (s3Bucket, s3Key, request) => {
    const s3Params = {
      Bucket: s3Bucket,
      Key: s3Key,
    };
    try {
      const data = await s3.deleteObject(s3Params).promise();
      return data;
    }
    catch (err) {
      const error = new Error(`Unable to delete object in S3: ${JSON.stringify(err.message)}`);
      throw error;
    }
  },
};
