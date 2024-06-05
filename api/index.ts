import fastify from "fastify";
import cookies from "@fastify/cookie";
import cors from "@fastify/cors";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import admin from "firebase-admin";
import { AdminRouter, PublicRouter } from "../src/routers/Main";
import HttpError from "../src/utils/HttpError";

import { deserializeUser } from "../src/utils/DeserializeUser";
import fastifyStatic from "@fastify/static";
import fastifySchedulePlugin from "@fastify/schedule";
import path from "path";
import _default from "fastify-metrics";
import dotenv from "dotenv";
import { percentageSelectionsJob } from "../src/utils/Jobs";
import { PrismaClient } from "@prisma/client";
dotenv.config();

const prisma = new PrismaClient();

const server = fastify({
  logger: true,
  disableRequestLogging: true,
});

export const app = initializeApp({
  credential: admin.credential.cert(JSON.parse(
    process.env.FIREBASE_ACCOUNT_KEY as string
  ))
});


server.decorateRequest('user', '')
server.addHook("preHandler", deserializeUser);

server.register(require("fastify-stripe"), {
  apiKey: process.env.STRIPE_KEY
});
server.register(fastifySchedulePlugin);
server.register(cors, {
  origin:
    ["production", "staging"].includes(process.env.ENV || "dev")
      ? process.env.CORS_ORIGIN
      : "*",
  credentials: true,
});
server.register(cookies, {
  hook: "onRequest",
});
server.register(_default);

// server.register(require("fastify-list-routes"), { colors: true });

server.register(PublicRouter, { prefix: "/api" });
server.register(AdminRouter, { prefix: "/api" });

// server.get('/metrics/prisma', async (_req: any, res: any) => {
//   res.end(await prisma.$metrics.prometheus())
// })

server.setErrorHandler((err, req, rep) => {
  if (err instanceof HttpError) {
    if(err.statusCode !== 401) {
      req.log.error(err);
    }
    rep.status(err.statusCode || 500).send({
      statusCode: err.statusCode || 500,
      message: err.message,
    });
  } else {
    req.log.error(err);
    rep.status(500).send(err);
  }
});

server.ready().then(
  () => { server.scheduler.addSimpleIntervalJob(percentageSelectionsJob); }
);

server.listen({ host: "0.0.0.0", port: +(process.env.PORT || 8080) }, (err, address) => {
	if (err) {
		process.exit(1);
	}
	console.log(`Server listening at ${address}, environment: ${process.env.ENV}`);
});