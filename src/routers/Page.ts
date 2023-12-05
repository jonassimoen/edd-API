import { DeletePageHandler, GetPageHandler, PostPageHandler, PutPageHandler } from "@/controllers/Page";
import { RequireUser } from "@/middleware/RequireUser";
import { PostPageSchema, PutPageSchema } from "@/types/body-schema";
import { FastifyPluginAsync } from "fastify";

export const PublicPageRouter: FastifyPluginAsync = async server => {
	server.route({
		method: 'GET',
		url: '',
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
		schema: {
			body: PostPageSchema
		}
	});

	server.route({
		method: 'PUT',
		url: '/:id',
		preHandler: RequireUser,
		handler: PutPageHandler,
		schema: {
			body: PutPageSchema
		}
	});

	server.route({
		method: 'DELETE',
		url: '/:id',
		preHandler: RequireUser,
		handler: DeletePageHandler,
	});
}