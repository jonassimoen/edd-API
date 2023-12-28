import { PostMatchStartingHandler } from "@/controllers/MatchEvent";
import { GetMatchStatisticsHandler, PutMatchStatisticHandler, PostMatchStatisticsHandler, DeleteMatchStatisticHandler, GetPlayerStatisticsHandler, ImportMatchStatisticHandler } from "@/controllers/Statistic";
import { RequireUser } from "@/middleware/RequireUser";
import { MatchStartingPostSchema, MatchStatisticPostSchema, MatchStatisticPutSchema } from "@/types/body-schema";
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
				handler: GetPlayerStatisticsHandler
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
				method: 'POST',
				url: '',
				preHandler: RequireUser,
				handler: PostMatchStatisticsHandler,
				schema: {
						body: MatchStatisticPostSchema
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