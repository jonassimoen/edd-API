import { prisma } from "../db/client";
import { signJwt, verifyJwt } from "../utils/JWT";
import { get } from "lodash";


export const reIssueAccessToken = async ({ refreshToken }: { refreshToken: string }) => {
	const { decoded } = verifyJwt(refreshToken);

	if (!decoded) return false;

	const user = await prisma.user.findUnique({
		where: {
			id: get(decoded, "id"),
		},
		cacheStrategy: { ttl: 60 },
	});

	if (!user ) return false;

	// const user = await prisma.user.findUnique({
	// 	where: {
	// 		id: session.userId,
	// 	},
	// });

	// if (!user) return false;

	const accessToken = signJwt({ ...user }, { expiresIn: "15m" });

	return accessToken;
};


export const deserializeUser = async(req: any, rep: any) => {
		const accessToken = req.cookies["token"] || req.headers.authorization?.replace(/^Bearer\s/, "") || "";
	const refreshToken = req.cookies["refreshToken"] || req.headers["x-refresh"] || "";
		if(!accessToken) {
				return;
		}
		const {decoded, expired} = verifyJwt(accessToken);

		if(decoded) {
				req.user = decoded;
				return;
		}

	if (expired && refreshToken) {
		const newAccessToken = await reIssueAccessToken({ refreshToken });

		if (newAccessToken) {
			rep.header("x-access-token", newAccessToken);

			rep.setCookie("accessToken", newAccessToken, {
				maxAge: 900000, // 15 mins
				httpOnly: true,
				domain: process.env.ENV === ("production" || "prod") ? process.env.COOKIE_ORIGIN : "localhost",
				path: "/",
				sameSite: "strict",
				secure: false,
			});
		}

		const res = verifyJwt(newAccessToken as string);

		req.user = res.decoded;
		return;
	}
}