import { FastifyPluginAsync } from "fastify";
import { GoogleAuthHandler } from "../controllers/UserAuth";
import { GetProfileHandler, GetTeamsHandler, LogoutHandler, PaymentIntentHandler, PaymentResultHandler, PutUserHandler } from "../controllers/User";
import { RequireUser } from "../middleware/RequireUser";

export const UserRouter: FastifyPluginAsync = async server => {
		server.route({
				method: "GET",
				url: '/oauth/google',
				handler: GoogleAuthHandler
		});

		server.route({
				method: "POST",
				url: '/logout',
				handler: LogoutHandler
		});

		server.route({
				method: "GET",
				url: '/profile',
				preHandler: RequireUser,
				handler: GetProfileHandler
		});

		server.route({
				method: "POST",
				url: '/pay',
				handler: PaymentIntentHandler,
		});

		server.route({
				method: "GET",
				url: '/payment-result',
				handler: PaymentResultHandler,
				schema: {
					querystring: {
						payment_intent: {type: "string"},
						payment_intent_client_secret: {type: "string"},
						redirect_status: {type: "string"},
					}
				}
		});

		server.route({
				method: "PUT",
				url: '/',
				preHandler: RequireUser,
				handler: PutUserHandler
		});

		server.route({
				method: "GET",
				url: '/teams',
				preHandler: RequireUser,
				handler: GetTeamsHandler
		})
}