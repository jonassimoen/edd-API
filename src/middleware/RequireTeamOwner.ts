import { prisma } from "../db/client";
import HttpError from "../utils/HttpError";

export const RequireTeamOwner = (req: any, rep: any, done: any) => {
	const user = req.user;
	prisma.team.findFirst({
		select: {
			userId: true,
		},
		where: {
			id: +req.params.id || 0,
		}
	}).then((data) => {
		if(data?.userId && data.userId !== user.id){
			done(new HttpError("This is not your team.", 403));
		}
		done();
	});
}