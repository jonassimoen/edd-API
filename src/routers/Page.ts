import { DeletePageHandler, DeletePageTranslationHandler, GetPageHandler, GetPageTranslationHandler, PostPageHandler, PostPageTranslationHandler, PutPageHandler, PutPageTranslationHandler } from "@/controllers/Page";
import { RequireUser } from "@/middleware/RequireUser";
import { FastifyPluginAsync } from "fastify";

export const PublicPageRouter: FastifyPluginAsync = async server => {
	server.route({
		method: 'GET',
		url: '',
		preHandler: RequireUser,
		handler: GetPageHandler,
		schema: {
			querystring: {
				slug: { type: 'string' }
			}
		}
	});

	server.route({
		method: 'POST',
		url: '',
		preHandler: RequireUser,
		handler: PostPageHandler,
	});

	server.route({
		method: 'PUT',
		url: '/:id',
		preHandler: RequireUser,
		handler: PutPageHandler,
	});

	server.route({
		method: 'DELETE',
		url: '/:id',
		preHandler: RequireUser,
		handler: DeletePageHandler,
	});

	server.route({
		method: 'GET',
		url: '/:pid/tl/:id',
		preHandler: RequireUser,
		handler: GetPageTranslationHandler,
	});

	server.route({
		method: 'POST',
		url: '/:id',
		preHandler: RequireUser,
		handler: PostPageTranslationHandler,
	});

	server.route({
		method: 'PUT',
		url: '/:pid/tl/:id',
		preHandler: RequireUser,
		handler: PutPageTranslationHandler,
	});

	server.route({
		method: 'DELETE',
		url: '/:pid/tl/:id',
		preHandler: RequireUser,
		handler: DeletePageTranslationHandler,
	});
}