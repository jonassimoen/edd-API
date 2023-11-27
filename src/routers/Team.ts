import { PostAddTeamHandler, PostCopyTeamHandler, DeleteDropTeamHandler, GetTeamHandler, GetPointsTeamHandler, PostBoosterTeamHandler, PostEditTeamHandler, PostSelectionsTeamHandler, PostTransfersTeamHandler, PostResetTransfersTeamHandler, PostBadgeHandler } from "@controllers/Team";
import { RequireUser } from "@middleware/RequireUser";
import { AddTeamSchema, TransfersTeamSchema } from "@typesd/body-schema";
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
				preHandler: RequireUser,
				handler: PostCopyTeamHandler
		});

		server.route({
				method: 'DELETE',
				url: '/:id/drop',
				preHandler: RequireUser,
				handler: DeleteDropTeamHandler
		});

		server.route({
				method: 'GET',
				url: '/:id',
				preHandler: RequireUser,
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
				preHandler: RequireUser,
				handler: PostBoosterTeamHandler
		});

		server.route({
				method: 'POST',
				url: '/:id',
				preHandler: RequireUser,
				handler: PostEditTeamHandler
		});

		server.route({
				method: 'POST',
				url: '/:id/selections',
				preHandler: RequireUser,
				handler: PostSelectionsTeamHandler
		});

		server.route({
				method: 'POST',
				url: '/:id/transfers',
				preHandler: RequireUser,
				handler: PostTransfersTeamHandler,
				schema: {
						body: TransfersTeamSchema
				}
		});

		server.route({
				method: 'POST',
				url: '/:id/transfers/reset',
				preHandler: RequireUser,
				handler: PostResetTransfersTeamHandler
		});

		server.route({
				method: 'POST',
				url: '/badge',
				preHandler: RequireUser,
				handler: PostBadgeHandler
		});
}