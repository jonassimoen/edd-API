const awsLambdaFastify = require("aws-lambda-fastify");
const app = require('api');

const proxy = awsLambdaFastify(app)

exports.handler = proxy;