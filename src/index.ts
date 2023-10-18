import fastify from "fastify";
import cookies from "@fastify/cookie"
import cors from "@fastify/cors"
import HttpError from "@utils/HttpError";
import { AdminRouter, PublicRouter } from "@/routers/Main";

import dotenv from "dotenv";
import { deserializeUser } from "@utils/DeserializeUser";
import fastifyStatic from "@fastify/static";
import path from "path";
dotenv.config();

const server = fastify({

})

server.addHook("preHandler", deserializeUser);



server.register(cors, {
	origin: process.env.ENV === ("production" || "prod") ? process.env.CORS_ORIGIN : "*",
	credentials: true,
});
server.register(cookies, {
	hook: "onRequest",
});
console.log(path.join(__dirname, '../static'))

server.register(fastifyStatic, {
	root: path.join(__dirname, '../static'),
	prefix: '/static/',
	list: true,
	index: false,
});

server.register(PublicRouter, { prefix: "/api" })
server.register(AdminRouter, { prefix: "/api" })

server.get("/ping", (req: any, res: any) => {
	res.status(200).send();
});

server.setErrorHandler((err, req, rep) => {
	console.log(err)
	if (err instanceof HttpError) {
		rep.status(err.statusCode || 500).send({
			statusCode: err.statusCode || 500,
			message: err.message,
		});
	} else {
		rep.status(500).send(err);
	}
})

server.listen({ host: "0.0.0.0", port: +(process.env.PORT || 8080) }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log(`Server listening at ${address}`);
});