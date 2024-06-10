import { CookieSerializeOptions } from "@fastify/cookie";
import { getGoogleOAuthTokens, getGoogleUserInfo } from "../services/auth/google";
import { prisma } from "../db/client";
import { signJwt } from "../utils/JWT";
import { AccessTokenRequest } from "../types/http";
import qs from "qs";

export const accessTokenCookieOptions: CookieSerializeOptions = {
	maxAge: 900000, // 15 mins
	httpOnly: true,
	domain: ["production", "staging"].includes(process.env.ENV || "dev") ? process.env.COOKIE_ORIGIN : "localhost",
	sameSite: "lax",
	path: "/",
	secure: false,
};
export const refreshTokenCookieOptions: CookieSerializeOptions = {
	...accessTokenCookieOptions,
	maxAge: 3.154e10, // 1 year
};

export const GoogleAuthHandler = async (req: AccessTokenRequest, rep: any) => {
	console.log("ok");
	if(req.query.error) {
		rep.redirect(process.env.WEBAPP_URL);
	}
	const code = req.query.code as string
	try {
		const { id_token, access_token } = await getGoogleOAuthTokens({ code });
		const googleUserInfo = await getGoogleUserInfo({ id_token, access_token });
		// user has no account yet
		let user = await prisma.user.findUnique({
			cacheStrategy: {
				ttl: 300,
				swr: 600,
			},
			where: {
				email: googleUserInfo.email
			}
		});

		let firstSignIn = false;	
		if( !user && (process.env.DISABLED_REGISTRATIONS === "true" || false)) {
			return rep.redirect(`${process.env.WEBAPP_URL}/denied?${qs.stringify({ reason: "registrations-disabled" })}`);
		}
		if (user && user.banned) {
			return rep.redirect(`${process.env.WEBAPP_URL}/denied?${qs.stringify({ reason: "banned" })}`);
		}
		if (!user) {
			user = await prisma.user.create({
				data: {
					email: googleUserInfo.email,
					firstName: googleUserInfo.given_name,
					lastName: googleUserInfo.family_name,
					role: 0
				}
			})
			firstSignIn = true;
		}

		const accessToken = signJwt({ ...user }, { expiresIn: "15m" });
		const refreshToken = signJwt({ ...user }, { expiresIn: "30d" });
		rep.setCookie("token", accessToken, accessTokenCookieOptions);
		rep.setCookie("refreshToken", refreshToken, refreshTokenCookieOptions);
		return rep.redirect(`${process.env.WEBAPP_URL}/login/callback?${qs.stringify({ token: accessToken, refreshToken: refreshToken })}`);


		// rep.send(googleUserInfo)
	} catch (err) {
		req.log.error(err);
	}
}