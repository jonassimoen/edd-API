import HealthCheck from "../controllers/HealthCheck";
import { DeletePlayerHandler, GetPlayersHandler, ImportPlayersHandler, PostPlayerHandler, PutPlayerHandler } from "../controllers/Player";
import { RequireUser } from "../middleware/RequireUser";
import { PlayerPostSchema, PlayerPutSchema } from "../types/body-schema";
import { FastifyPluginAsync } from "fastify";

export const PublicPlayerRouter: FastifyPluginAsync = async server => {
		server.route({
				method: 'GET',
				url: '',
				preHandler: RequireUser,
				handler: GetPlayersHandler // TODO
		});

		server.route({
				method: 'GET',
				url: '/:id',
				preHandler: RequireUser,
				handler: HealthCheck // TODO
		});
}

export const AdminPlayerRouter: FastifyPluginAsync = async server => {
		server.route({
				method: 'PUT',
				url: '/:id',
				preHandler: RequireUser,
				handler: PutPlayerHandler, 
				schema: {
						body: PlayerPutSchema
				}
		});
		
		server.route({
				method: 'POST',
				url: '',
				preHandler: RequireUser,
				handler: PostPlayerHandler,
				schema: {
						body: PlayerPostSchema
				}
		});
		
		server.route({
				method: 'DELETE',
				url: '/:id',
				preHandler: RequireUser,
				handler: DeletePlayerHandler
		});
		
		server.route({
				method: 'POST',
				url: '/import',
				preHandler: RequireUser,
				handler: ImportPlayersHandler
		});
}