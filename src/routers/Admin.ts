import { FastifyPluginAsync } from "fastify";
import { GeneralClubWinnerSchema } from "../types/body-schema";
import { RequireUser } from "../middleware/RequireUser";
import { GeneralInfoHandler, PostClubWinnerHandler } from "../controllers/General";

export const AdminGeneralRouter: FastifyPluginAsync = async server => {
	server.route({
		method: "GET",
		url: '/general',
		preHandler: RequireUser,
		handler: GeneralInfoHandler,
	});
	server.route({
		method: "POST",
		url: '/general/winner',
		preHandler: RequireUser,
		schema: GeneralClubWinnerSchema,
		handler: PostClubWinnerHandler,
	});
}