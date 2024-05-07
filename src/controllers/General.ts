import { prisma } from "../db/client";

export const GeneralInfoHandler = async (req: any, rep: any) => {
	rep.send({
		version: 1,
		userCount: await prisma.user.count(),
		teamCount: await prisma.team.count(),
		clubWinner: await prisma.club.findFirst({where: {winner: true}}),
		users: await prisma.user.findMany({
			select: {
				firstName: true,
				lastName: true,
				email: true,
				payed: true,
			}
		})
		// teamCount: await prisma.team.count(),
	});
}

export const PostClubWinnerHandler = async (req: any, rep: any) => {
	await prisma.club.update({
		where: {
			id: +req.body.clubWinner
		},
		data: {
			winner: true,
		}
	});
	await prisma.$queryRaw`CALL "processWinner"()`;
	rep.send({message: "Winnaar succesvol gewijzigd."})
}