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
dotenv.config();

export const server = fastify({
  logger: true,
  disableRequestLogging: true,
});


export const app = initializeApp({
  credential: admin.credential.cert(JSON.parse(
    process.env.FIREBASE_ACCOUNT_KEY as string
  ))
});

server.addHook("preHandler", deserializeUser);

// server.register(require("fastify-list-routes"), { colors: true });
server.register(require("fastify-stripe"), {
  apiKey: process.env.STRIPE_KEY
})
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

server.register(fastifyStatic, {
  root: path.join(__dirname, "../static"),
  prefix: "/api/static/",
  list: true,
  index: false,
});

server.register(PublicRouter, { prefix: "/api" });
server.register(AdminRouter, { prefix: "/api" });

server.get("/ping", (req: any, res: any) => {
  res.status(200).send();
});
server.get("/metrics/prisma", async (req: any, res: any) => {
  res.send(/*await prisma.$metrics.prometheus()*/);
})

server.setErrorHandler((err, req, rep) => {
  req.log.error(err);
  if (err instanceof HttpError) {
    rep.status(err.statusCode || 500).send({
      statusCode: err.statusCode || 500,
      message: err.message,
    });
  } else {
    rep.status(500).send(err);
  }
});

server.listen({ host: "0.0.0.0", port: +(process.env.PORT || 8080) }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log(`Server listening at ${address}, environment: ${process.env.ENV}`);
});

server.ready().then(
  () => { server.scheduler.addSimpleIntervalJob(percentageSelectionsJob); }
);

export default async (req: any, res: any) => {
  await server.ready().then(
    () => { server.scheduler.addSimpleIntervalJob(percentageSelectionsJob); }
  );
  server.server.emit("request", req, res);
};
