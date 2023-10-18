import { CookieSerializeOptions } from "@fastify/cookie";
import { getGoogleOAuthTokens, getGoogleUserInfo } from "@services/auth/google";
import { prisma } from "@db/client";
import { signJwt } from "@utils/JWT";
import { AccessTokenRequest } from "@types/http";
import qs from "qs";

const accessTokenCookieOptions: CookieSerializeOptions = {
    maxAge: 900000, // 15 mins
    httpOnly: true,
    domain: process.env.ENV === ("production" || "prod") ? process.env.COOKIE_ORIGIN : "localhost",
    sameSite: "lax",
    path: "/",
    secure: false,
};
const refreshTokenCookieOptions: CookieSerializeOptions = {
	...accessTokenCookieOptions,
	maxAge: 3.154e10, // 1 year
};

export const GoogleAuthHandler = async (req: AccessTokenRequest, rep: any) => {
    const code = req.query.code as string
    try {
        const { id_token, access_token } = await getGoogleOAuthTokens({ code });
        const googleUserInfo = await getGoogleUserInfo({ id_token, access_token });

        // user has no account yet
        const user = await prisma.user.findUnique({
            where: {
                email: googleUserInfo.email
            }
        })
        if (!user) {
            const user = await prisma.user.create({
                data: {
                    email: googleUserInfo.email,
                    firstName: googleUserInfo.given_name,
                    lastName: googleUserInfo.family_name,
                    role: 0
                }
            })
            rep.redirect(`${process.env.WEBAPP_URL}/welcome`,)
        } else {
            const accessToken = signJwt({ ...user }, { expiresIn: "15m" });
            const refreshToken = signJwt({ ...user }, { expiresIn: "30d" });
            rep.setCookie("token", accessToken, accessTokenCookieOptions);
            rep.setCookie("refreshToken", refreshToken, refreshTokenCookieOptions);
            console.log(req.headers.origin)
            rep.redirect(`${process.env.WEBAPP_URL}/login/callback?${qs.stringify({token: accessToken, refreshToken: refreshToken})}`);
            // rep.send("ok")
        }


        // rep.send(googleUserInfo)
    } catch (err) {
        console.log(err)
    }
}