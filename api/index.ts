import fastify from "fastify";
import cookies from "@fastify/cookie";
import cors from "@fastify/cors";
import { AdminRouter, PublicRouter } from "../src/routers/Main";
import HttpError from "../src/utils/HttpError";

import dotenv from "dotenv";
import { deserializeUser } from "../src/utils/DeserializeUser";
import fastifyStatic from "@fastify/static";
import path from "path";
import _default from "fastify-metrics";
dotenv.config();

export const server = fastify({
  logger: {
    level: "info",
  },
  disableRequestLogging: true,
});

server.addHook("preHandler", deserializeUser);

server.register(require("fastify-list-routes"), { colors: true });
server.register(require("fastify-stripe"), {
  apiKey: process.env.STRIPE_KEY
})

server.register(cors, {
  origin:
    process.env.ENV === ("production" || "prod")
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

export default async (req: any, res: any) => {
  await server.ready();
  server.server.emit("request", req, res);
};
