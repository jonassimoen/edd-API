import { RequireTeamOwner } from "../middleware/RequireTeamOwner";
import { PostAddTeamHandler, PostCopyTeamHandler, DeleteDropTeamHandler, GetTeamHandler, GetPointsTeamHandler, PostBoosterTeamHandler, PostEditTeamHandler, PostSelectionsTeamHandler, PostTransfersTeamHandler, PostResetTransfersTeamHandler, PostBadgeHandler, GetRankingHandler } from "../controllers/Team";
import { RequireUser } from "../middleware/RequireUser";
import { AddTeamSchema, TransfersTeamSchema } from "../types/body-schema";
import { FastifyPluginAsync } from "fastify";

export const TeamRouter: FastifyPluginAsync = async server => {
		server.route({
				method: 'POST',
				url: '/add',
				preHandler: RequireUser,
				handler: PostAddTeamHandler,
				schema: {
						body: AddTeamSchema
				}
		});

		server.route({
				method: 'POST',
				url: '/:id/copy',
				preHandler: [RequireUser, RequireTeamOwner],
				handler: PostCopyTeamHandler
		});

		server.route({
				method: 'DELETE',
				url: '/:id/drop',
				preHandler: [RequireUser, RequireTeamOwner],
				handler: DeleteDropTeamHandler
		});

		server.route({
				method: 'GET',
				url: '/:id',
				preHandler: [RequireUser, RequireTeamOwner],
				handler: GetTeamHandler
		});

		server.route({
				method: 'GET',
				url: '/:id/points/:weekId',
				preHandler: RequireUser,
				handler: GetPointsTeamHandler
		});

		server.route({
				method: 'POST',
				url: '/:id/booster',
				preHandler: [RequireUser, RequireTeamOwner],
				handler: PostBoosterTeamHandler
		});

		server.route({
				method: 'POST',
				url: '/:id',
				preHandler: [RequireUser, RequireTeamOwner],
				handler: PostEditTeamHandler
		});

		server.route({
				method: 'POST',
				url: '/:id/selections',
				preHandler: [RequireUser, RequireTeamOwner],
				handler: PostSelectionsTeamHandler
		});

		server.route({
				method: 'POST',
				url: '/:id/transfers',
				preHandler: [RequireUser, RequireTeamOwner],
				handler: PostTransfersTeamHandler,
				schema: {
						body: TransfersTeamSchema
				}
		});

		server.route({
				method: 'POST',
				url: '/:id/transfers/reset',
				preHandler: [RequireUser, RequireTeamOwner],
				handler: PostResetTransfersTeamHandler
		});

		server.route({
				method: 'POST',
				url: '/badge',
				preHandler: [RequireUser, RequireTeamOwner],
				handler: PostBadgeHandler
		});

		server.route({
				method: 'GET',
				url: '/rankings',
				handler: GetRankingHandler
		});
}