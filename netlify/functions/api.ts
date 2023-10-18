
import dotenv from "dotenv";
import cookies from "@fastify/cookie"
import cors from "@fastify/cors"
import { deserializeUser } from "@utils/DeserializeUser";
import fastify from "fastify";
import serverless from "serverless-http";
import fastifyStatic from "@fastify/static";
import path from "path";
import { AdminRouter, PublicRouter } from "@/routers/Main";
dotenv.config();

export const api = fastify();
api.addHook("preHandler", deserializeUser);

api.register(cors, {
	origin: process.env.ENV === ("production" || "prod") ? process.env.CORS_ORIGIN : "*",
	credentials: true,
});
api.register(cookies, {
	hook: "onRequest",
});
console.log(path.join(__dirname, '../static'))

api.register(fastifyStatic, {
	root: path.join(__dirname, '../static'),
	prefix: '/static/',
	list: true,
	index: false,
});

api.register(PublicRouter, { prefix: "/api" })
api.register(AdminRouter, { prefix: "/api" })

api.get("/ping", (req: any, res: any) => {
	res.status(200).send();
});


// export const handler = serverless(api);
if(require.main === module) {
    api.listen({ host: "0.0.0.0", port: +(process.env.PORT || 8080) }, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Server listening at ${address}`);
    });
}