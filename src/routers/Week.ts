import { PostMatchStartingHandler } from "@/controllers/MatchEvent";
import { GetWeeksHandler, GetWeekHandler, PutWeekHandler, PostWeeksHandler, DeleteWeekHandler } from "@/controllers/Week";
import { RequireUser } from "@/middleware/RequireUser";
import { MatchStartingPostSchema, WeekPostSchema, WeekPutSchema } from "@/types/body-schema";
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
        method: 'DELETE',
        url: '',
        preHandler: RequireUser,
        handler: DeleteWeekHandler
    });
}