import { upcomingWeekId } from "../utils/Common";
import { prisma } from "../db/client";

export const GeneralInfoHandler = async (req: any, rep: any) => {
	rep.send({
		version: 1,
		userCount: await prisma.user.count(),
		teamCount: await prisma.team.count(),
		clubWinner: await prisma.club.findFirst({where: {winner: true}}),
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

export const GetUserOverview = async(req: any, rep: any) => {
	const weekId = await upcomingWeekId();

	const [users, teamsWithActiveBoosters, audits] = await Promise.all([
		prisma.user.findMany({
			select: {
				email: true,
				firstName: true,
				lastName: true,
				payed: true,
			}
		}),
		prisma.team.findMany({
			select: {
				user: {
					select: {
						email: true,
					}
				},
				tripleCaptain: true,
				viceVictory: true,
				freeHit: true,
				superSubs: true,
				hiddenGem: true,
				goalRush: true,
			},
			where: {
				OR: [
					{tripleCaptain: weekId},
					{viceVictory: weekId},
					{freeHit: weekId},
					{superSubs: weekId},
					{hiddenGem: weekId},
					{goalRush: weekId},
				],
			}
		}),
		prisma.audit.findMany({
			take: 100
		})
	]);

	rep.send({
		users,
		activeBoosters: teamsWithActiveBoosters.map((u: any) => ({
			user: u.user.email,
			boosters: Object.keys(u).filter((v: string) => u[v] == weekId)
		})),
		audits
	})
}