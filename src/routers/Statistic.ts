import { GetMatchStatisticsHandler, PutMatchStatisticHandler, DeleteMatchStatisticHandler, GetPlayerStatisticsHandler, ImportMatchStatisticHandler } from "../controllers/Statistic";
import { RequireUser } from "../middleware/RequireUser";
import { MatchStatisticPutSchema, PlayerStatisticPutSchema } from "../types/body-schema";
import { FastifyPluginAsync } from "fastify";

export const PublicMatchStatisticRouter: FastifyPluginAsync = async server => {
		server.route({
				method: 'GET',
				url: '',
				preHandler: RequireUser,
				handler: GetMatchStatisticsHandler
		});
}

export const PublicPlayerStatisticRouter: FastifyPluginAsync = async server => {
		server.route({
				method: 'GET',
				url: '',
				preHandler: RequireUser,
				handler: GetPlayerStatisticsHandler,
				schema: {
					querystring: PlayerStatisticPutSchema
				}
		});
}

export const AdminMatchStatisticRouter: FastifyPluginAsync = async server => {
		server.route({
				method: 'PUT',
				url: '',
				preHandler: RequireUser,
				handler: PutMatchStatisticHandler,
				schema: {
					body: MatchStatisticPutSchema
				}
		});

		server.route({
				method: 'DELETE',
				url: '',
				preHandler: RequireUser,
				handler: DeleteMatchStatisticHandler
		});

		server.route({
				method: 'GET',
				url: '/import',
				preHandler: RequireUser,
				handler: ImportMatchStatisticHandler
		});
}