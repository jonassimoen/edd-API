import { FastifyPluginAsync } from "fastify";
import { GoogleAuthHandler } from "../controllers/UserAuth";
import { GetProfileHandler, GetTeamsHandler, LogoutHandler, PaymentIntentHandler, PaymentResultHandler } from "../controllers/User";
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
				preHandler: RequireUser,
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
				preHandler: RequireUser,
				handler: PaymentIntentHandler,
		});

		server.route({
				method: "GET",
				url: '/payment-result',
				preHandler: RequireUser,
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
				method: "GET",
				url: '/teams',
				preHandler: RequireUser,
				handler: GetTeamsHandler
		})
}