import { FastifyPluginAsync } from "fastify";
import { GetArticleHandler, GetArticlesHandler, PostArticleHandler, PutArticleHandler } from "../controllers/News";
import { PostArticleSchema, PutArticleSchema } from "../types/body-schema";

export const PublicNewsRouter: FastifyPluginAsync = async server => {
	server.route({
		method: 'GET',
		url: '',
		handler: GetArticlesHandler,
		schema: {
			querystring: {
				page: { type: 'number' }
			}
		}
	});
	
	server.route({
		method: 'GET',
		url: '/:slug',
		handler: GetArticleHandler
	});
}

export const AdminNewsRouter:  FastifyPluginAsync = async server => {
	server.route({
		method: 'POST',
		url: '',
		handler: PostArticleHandler,
		schema: {
			body: PostArticleSchema,
		}
	});
	server.route({
		method: 'PUT',
		url: '/:id',
		handler: PutArticleHandler,
		schema: {
			body: PutArticleSchema,
		}
	});
}