import { GetMatchEventsHandler, PutMatchEventHandler, PostMatchEventsHandler, DeleteMatchEventHandler, PostMatchStartingHandler } from "@/controllers/MatchEvent";
import { RequireUser } from "@/middleware/RequireUser";
import { MatchEventPutSchema, MatchEventPostSchema, MatchStartingPostSchema } from "@/typesd/body-schema";
import { FastifyPluginAsync } from "fastify";

export const PublicMatchEventRouter: FastifyPluginAsync = async server => {
		server.route({
				method: 'GET',
				url: '',
				preHandler: RequireUser,
				handler: GetMatchEventsHandler
		});
}

export const AdminMatchEventRouter: FastifyPluginAsync = async server => {
		server.route({
				method: 'PUT',
				url: '',
				preHandler: RequireUser,
				handler: PutMatchEventHandler,
				schema: {
						body: MatchEventPutSchema
				}
		});
		
		server.route({
				method: 'POST',
				url: '',
				preHandler: RequireUser,
				handler: PostMatchEventsHandler,
				schema: {
						body: MatchEventPostSchema
				}
		});
		
		server.route({
				method: 'POST',
				url: '/starting',
				preHandler: RequireUser,
				handler: PostMatchStartingHandler,
				schema: {
						body: MatchStartingPostSchema
				}
		});
		
		server.route({
				method: 'DELETE',
				url: '',
				preHandler: RequireUser,
				handler: DeleteMatchEventHandler
		});
}