import { ClubPostSchema, ClubPutSchema } from "../types/body-schema";
import { DeleteClubHandler, GetClubHandler, GetClubsHandler, ImportClubsHandler, PostClubHandler, PutClubHandler } from "../controllers/Club";
import { RequireUser } from "../middleware/RequireUser";
import { FastifyPluginAsync } from "fastify"

export const PublicClubRouter: FastifyPluginAsync = async server => {
		server.route({
				method: 'GET',
				url: '',
				preHandler: RequireUser,
				handler: GetClubsHandler
		});
		
		server.route({
				method: 'GET',
				url: '/:id',
				preHandler: RequireUser,
				handler: GetClubHandler
		});
}

export const AdminClubRouter: FastifyPluginAsync = async server => {
		server.route({
				method: 'PUT',
				url: '/:id',
				preHandler: RequireUser,
				handler: PutClubHandler,
				schema: {
						body: ClubPutSchema
				}
		});
		
		server.route({
				method: 'POST',
				url: '',
				preHandler: RequireUser,
				handler: PostClubHandler,
				schema: {
						body: ClubPostSchema
				}
		});
		
		server.route({
				method: 'DELETE',
				url: '/:id',
				preHandler: RequireUser,
				handler: DeleteClubHandler
		});
		
		server.route({
				method: 'POST',
				url: '/import',
				preHandler: RequireUser,
				handler: ImportClubsHandler
		});
}