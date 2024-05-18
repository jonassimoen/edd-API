import { FastifyPluginAsync } from "fastify";
import { GetArticleHandler, GetArticlesHandler } from "../controllers/News";

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