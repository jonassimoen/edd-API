const awsLambdaFastify = require("aws-lambda-fastify");
const app = require('./../../src/index');

const proxy = awsLambdaFastify(app)

exports.handler = proxy;