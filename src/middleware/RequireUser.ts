import HttpError from "../utils/HttpError";

export const RequireUser = (req: any, rep: any, done: any) => {
		const user = req.user;

		if (!user) {
			done(new HttpError("No credentials provided.", 401));
		}
		if (user?.banned) {
			done(new HttpError("You have been banned.", 403));
		}
		done();
}