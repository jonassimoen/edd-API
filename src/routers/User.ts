import { FastifyPluginAsync } from "fastify";
import { GoogleAuthHandler } from "../controllers/UserAuth";
import { GetProfileHandler, GetTeamsHandler, LogoutHandler, PutUserHandler } from "../controllers/User";
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