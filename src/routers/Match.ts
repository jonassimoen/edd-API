import { DeleteMatchHandler, GetMatchHandler, GetMatchesHandler, ImportMatchesHandler, PostMatchHandler, PutMatchHandler } from '../controllers/Match';

import { RequireUser } from "../middleware/RequireUser";
import { MatchPostSchema, MatchPutSchema } from "../types/body-schema";
import { FastifyPluginAsync } from "fastify"

export const PublicMatchRouter: FastifyPluginAsync = async server => {
		server.route({
				method: 'GET',
				url: '',
				preHandler: RequireUser,
				handler: GetMatchesHandler
		});
		
		server.route({
				method: 'GET',
				url: '/:id',
				preHandler: RequireUser,
				handler: GetMatchHandler
		});
}

export const AdminMatchRouter: FastifyPluginAsync = async server => {
		server.route({
				method: 'PUT',
				url: '/:id',
				preHandler: RequireUser,
				handler: PutMatchHandler,
				schema: {
						body: MatchPutSchema
				}
		});
		
		server.route({
				method: 'POST',
				url: '',
				preHandler: RequireUser,
				handler: PostMatchHandler,
				schema: {
						body: MatchPostSchema
				}
		});
		
		server.route({
				method: 'DELETE',
				url: '/:id',
				preHandler: RequireUser,
				handler: DeleteMatchHandler
		});
		
		server.route({
				method: 'GET',
				url: '/import',
				preHandler: RequireUser,
				handler: ImportMatchesHandler
		});
}