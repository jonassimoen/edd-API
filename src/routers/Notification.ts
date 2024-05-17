import { FastifyPluginAsync } from "fastify";
import { RegisterTokenHandler, PushNotificationHandler } from "../controllers/Notification";
import { RequireAdmin } from "../middleware/RequireAdmin";
import { RequireUser } from "../middleware/RequireUser";
import { PostTokenSchema } from "../types/body-schema";

export const NotificationRouter: FastifyPluginAsync = async server => {
	server.route({
		method: "POST",
		url: '/registration',
		preHandler: RequireUser,
		handler: RegisterTokenHandler,
		schema: PostTokenSchema,
	});
	server.route({
		method: "POST",
		url: '/new',
		preHandler: [RequireUser, RequireAdmin],
		handler: PushNotificationHandler,
		schema: PostTokenSchema,
	});
}