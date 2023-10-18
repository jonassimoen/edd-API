import HttpError from "@utils/HttpError";

export const requireAdmin = (req: any, rep: any, done: any) => {
	const user = req.user;

	if (user.role != 7) {
		done(new HttpError("You do not have the magic power", 403));
	}
	done();
};