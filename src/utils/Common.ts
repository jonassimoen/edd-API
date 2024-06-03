import { Player } from "@prisma/client";
import { prisma } from "../db/client"
import * as fs from "fs";

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

// startingByPosition = [0, nrGk, nrDef, nrMid, nrFw]
export const validateStartingLineup = (startingByPosition: number[]) => {
	if(startingByPosition.reduce((sum: number, cur: number) => sum += cur) != 11) {
		return false;
	}
	return (startingByPosition[0] === 0) &&											// 0 COACH
			(startingByPosition[1] === 1) && 										// 1 GK
			((startingByPosition[2] >= 3) && (startingByPosition[2] <= 5)) &&		// 3-5 DEF
			((startingByPosition[3] >= 3) && (startingByPosition[3] <= 5)) && 		// 3-5 MID
			((startingByPosition[4] >= 1) && (startingByPosition[4] <= 3))			// 1-3 FOR
}