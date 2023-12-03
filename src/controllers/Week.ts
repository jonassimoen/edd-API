import { prisma } from "@db/client"
import { ProcessState } from "@prisma/client";

export const GetWeeksHandler = async (req: any, rep: any) => {
	const weeks = await prisma.week.findMany({
		orderBy: {
			id: 'asc'
		}
	});
	rep.send(weeks);
}

export const GetWeekHandler = async (req: any, rep: any) => {
	const week = await prisma.week.findUnique({
		where: {
			id: +req.params.id
		}
	});
	rep.send(week);
}

export const PutWeekHandler = async (req: any, rep: any) => {
	const week = await prisma.week.update({
		where: {
			id: +req.params.id
		},
		data: {
			deadlineDate: req.body.deadlineDate
		}
	});
	rep.send(week);
}

export const PostWeeksHandler = async (req: any, rep: any) => {
	const week = await prisma.week.create({
		data: {
			id: +req.body.id,
			deadlineDate: req.body.deadlineDate
		}
	});
	rep.send(week);
}

export const PostWeekValidateHandler = async (req: any, rep: any) => {
	const statsSumPoints = await prisma.statistic.groupBy({
		where: {
			match: {
				weekId: +req.params.id
			}
		},
		by: ['playerId'],
		_sum: {
			points: true,
		}
	});

	const teamPoints = await prisma.selection.groupBy({
		where: {
			weekId: +req.params.id,
			starting: 1,
		},
		by: ['teamId'],
		_sum: {
			points: true
		}
	});

	const [updatedWeek, ...other] = await prisma.$transaction([
		prisma.week.update({
			where: {
				id: +req.params.id,
			},
			data: {
				validated: true,
				Match: {
					updateMany: {
						where: {
							weekId: +req.params.id
						},
						data: {
							status: ProcessState.VALIDATED
						},
					},
				},
			}
		}),
		...statsSumPoints.map((sumStatPlayer: any) =>
			prisma.player.update({
				where: {
					id: sumStatPlayer.playerId,
				},
				data: {
					points: {
						increment: sumStatPlayer._sum.points
					}
				}
			})
		),
		...teamPoints.map((teamPoint: any) => 
			prisma.team.update({
				where: {
					id: teamPoint.teamId,
				},
				data: {
					points: {
						increment: teamPoint._sum.points,
					}
				}
			})
		),
	]);
	rep.send(updatedWeek);
}

export const DeleteWeekHandler = async (req: any, rep: any) => {

}
export const GetDeadlineInfoHandler = async (req: any, rep: any) => {
	const weeks = await prisma.week.findMany({
		orderBy: {
			id: 'asc'
		}
	});
	const deadlineWeek = await prisma.week.findFirst({
		where: {
			deadlineDate: {
				gte: new Date()
			}
		},
		orderBy: {
			deadlineDate: 'asc',
		}
	});
	const displayWeek = await prisma.week.findFirst({
		where: {
			deadlineDate: {
				lt: deadlineWeek?.deadlineDate
			}
		},
		orderBy: {
			deadlineDate: 'desc'
		}
	});
	rep.send({
		deadlineInfo: {
			deadlineDate: deadlineWeek?.deadlineDate,
			deadlineWeek: deadlineWeek?.id,
			displayWeek: displayWeek?.id,
			endWeek: weeks[weeks.length - 1].id,
		},
		weeks
	});
}