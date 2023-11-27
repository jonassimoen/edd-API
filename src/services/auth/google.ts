import axios from "axios";
import HttpError from "@utils/HttpError";
import qs from "qs";


interface GoogleTokensResult {
		access_token: string;
		expires_in: number;
		refresh_token: string;
		scope: string;
		id_token: string;
		token_type: string;
}

export const getGoogleOAuthTokens = async ({ code }: { code: string }): Promise<GoogleTokensResult> => {
		const url = "https://oauth2.googleapis.com/token";

		const values = {
				client_id: process.env.OAUTH_GOOGLE_CLIENT_ID,
				client_secret: process.env.OAUTH_GOOGLE_CLIENT_SECRET,
				code,
				grant_type: "authorization_code",
				redirect_uri: process.env.OAUTH_GOOGLE_REDIRECT_URL,
		};

		try {
				const res = await axios.post<GoogleTokensResult>(url, qs.stringify(values), {
						headers: {
								"Content-Type": "application/x-www-form-urlencoded",
						},
				});
				return res.data;
		} catch (err: any) {
				console.error(err.response);
				console.error(err.response.data.error);
				throw new HttpError(err.message, 401);
		}
};

interface GoogleUserInfo {
		id: string;
		email: string;
		verified_email: boolean;
		name: string;
		given_name: string;
		family_name: string;
		picture: string;
		locale: string;
}

export const getGoogleUserInfo = async ({
		id_token,
		access_token,
}: {
		id_token: string;
		access_token: string;
}): Promise<GoogleUserInfo> => {
		try {
				const res = await axios.get<GoogleUserInfo>(
						`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
						{
								headers: {
										Authorization: `Bearer ${id_token}`,
								},
						}
				);
				return res.data;
		} catch (err: any) {
				throw new HttpError(err.message, 401);
		}
};
