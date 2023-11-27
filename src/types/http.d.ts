import { FastifyRequest, FastifyReply } from "fastify";
import { JwtPayload } from "jsonwebtoken";

declare type RequestWithUser = FastifyRequest & {
		user: string | JwtPayload;
}

type AccessTokenRequest = FastifyRequest<{
		Querystring: { code: string };
}>;

declare type Reply = FastifyReply & {}
