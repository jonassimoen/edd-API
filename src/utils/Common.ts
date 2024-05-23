import { Player } from "@prisma/client";
import { prisma } from "../db/client"

export const upcomingWeekId = async () => {
	const week = await prisma.week.findFirst({
		where: {
			deadlineDate: {
					gte: new Date()
			}
		},
		orderBy: {
				deadlineDate: 'asc',
		}
	});
	return (week && week.id) || 0;
}

export const finalWeekId = async () => {
	const week = await prisma.week.findFirst({
		orderBy: {
			deadlineDate: 'desc'
		},
		take: 1
	});

	return (week && week.id) || 0;
}

export const validateStartingLineup = (starting: number[]) => {
	if(starting.reduce((sum: number, cur: number) => sum += cur) != 11) {
		return false;
	}
	return (starting[0] === 0) &&								// 0 COACH
			(starting[1] === 1) && 								// 1 GK
			((starting[2] >= 3) && (starting[2] <= 5)) &&		// 3-5 DEF
			((starting[3] >= 3) && (starting[3] <= 5)) && 		// 3-5 MID
			((starting[4] >= 1) && (starting[4] <= 3))			// 1-3 FOR
}