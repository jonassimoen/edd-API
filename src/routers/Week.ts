import { GetWeeksHandler, GetWeekHandler, PutWeekHandler, PostWeeksHandler, DeleteWeekHandler, GetDeadlineInfoHandler, PostWeekValidateHandler } from "@controllers/Week";
import { RequireUser } from "@middleware/RequireUser";
import { WeekPostSchema, WeekPutSchema } from "@typesd/body-schema";
import { FastifyPluginAsync } from "fastify";

export const PublicWeekRouter: FastifyPluginAsync = async server => {
		server.route({
				method: 'GET',
				url: '',
				preHandler: RequireUser,
				handler: GetWeeksHandler
		});
		server.route({
				method: 'GET',
				url: '/:id',
				preHandler: RequireUser,
				handler: GetWeekHandler
		});
		server.route({
				method: 'GET',
				url: '/deadline-info',
				preHandler: RequireUser,
				handler: GetDeadlineInfoHandler
		});
}

export const AdminWeekRouter: FastifyPluginAsync = async server => {
		server.route({
				method: 'PUT',
				url: '/:id',
				preHandler: RequireUser,
				handler: PutWeekHandler,
				schema: {
						body: WeekPutSchema
				}
		});

		server.route({
				method: 'POST',
				url: '',
				preHandler: RequireUser,
				handler: PostWeeksHandler,
				schema: {
						body: WeekPostSchema
				}
		});

		server.route({
				method: 'POST',
				url: '/:id/validate',
				preHandler: RequireUser,
				handler: PostWeekValidateHandler,
		});

		server.route({
				method: 'DELETE',
				url: '',
				preHandler: RequireUser,
				handler: DeleteWeekHandler
		});
}