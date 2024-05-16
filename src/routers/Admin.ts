import { FastifyPluginAsync } from "fastify";
import { GeneralClubWinnerSchema } from "../types/body-schema";
import { RequireUser } from "../middleware/RequireUser";
import { GeneralInfoHandler, GetAuditHandler, GetUserOverview, PostClubWinnerHandler } from "../controllers/General";

export const AdminGeneralRouter: FastifyPluginAsync = async server => {
	server.route({
		method: "GET",
		url: '/',
		preHandler: RequireUser,
		handler: GeneralInfoHandler,
	});
	server.route({
		method: "POST",
		url: '/winner',
		preHandler: RequireUser,
		schema: GeneralClubWinnerSchema,
		handler: PostClubWinnerHandler,
	});
	server.route({
		method: "GET",
		url: '/users',
		preHandler: RequireUser,
		handler: GetUserOverview
	});
	server.route({
		method: "GET",
		url: '/audit/:id',
		preHandler: RequireUser,
		handler: GetAuditHandler
	});
}