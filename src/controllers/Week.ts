import { prisma } from "../db/client"
import { ProcessState } from "@prisma/client";

export const GetWeeksHandler = async (req: any, rep: any) => {
	const weeks = await prisma.week.findMany({
		orderBy: {
			id: 'asc'
		},
		cacheStrategy: { ttl: 60 },
	});
	rep.send(weeks);
}

export const GetWeekHandler = async (req: any, rep: any) => {
	const week = await prisma.week.findUnique({
		where: {
			id: +req.params.id
		},
		cacheStrategy: { ttl: 60 },
	});
	rep.send(week);
}

export const PutWeekHandler = async (req: any, rep: any) => {
	const week = await prisma.week.update({
		where: {
			id: +req.params.id
		},
		data: {
			deadlineDate: req.body.deadlineDate,
			name: req.body.name,
		}
	});
	rep.send(week);
}

export const PostWeeksHandler = async (req: any, rep: any) => {
	const week = await prisma.week.create({
		data: {
			id: +req.body.id,
			deadlineDate: req.body.deadlineDate,
			name: req.body.name,
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
		},
		cacheStrategy: { ttl: 60 },
	});

	const teamPoints = await prisma.selection.groupBy({
		where: {
			weekId: +req.params.id,
			starting: 1,
		},
		by: ['teamId'],
		_sum: {
			points: true
		},
		cacheStrategy: { ttl: 60 },
	});

	const teamsWithSelections = await prisma.team.findMany({
		include: {
			selections: {
				where: {
					weekId: +req.params.id
				},
				include: {
					player: {
						select: {
							positionId: true,
							short: true,
						}
					}
				}
			}
		},
		cacheStrategy: { ttl: 60 },
	});
	try {
		await prisma.$transaction(async (prisma) => {

			for (const team of teamsWithSelections) {
				const startersNotPlaying = team.selections.filter((sel: any) => sel.starting && !sel.played);
				const benchersPlayed = team.selections.filter((sel: any) => !sel.starting && sel.played);

				const benchedKeeper = benchersPlayed.find((sel: any) => sel.player.positionId === 1);
				const benchedNonKeepers = benchersPlayed.filter((sel: any) => sel.player.positionId !== 1);

				console.log(`Team #${team.id} has ${team.selections.length} selections in week ${+req.params.id}, ${startersNotPlaying.length} starters did not play, ${benchersPlayed.length} bench players did play`);
				for (const starterNotPlayed of startersNotPlaying) {

					// keeper changing
					if (starterNotPlayed.player.positionId === 1) {
						if (benchedKeeper?.played) {
							console.log(`Keeper ${starterNotPlayed.player.short} replaced with keeper ${benchedKeeper?.player.short}`)
							await prisma.selection.update({
								where: { id: starterNotPlayed.id },
								data: { starting: 0 },
							});
							await prisma.selection.update({
								where: { id: benchedKeeper.id },
								data: { starting: 1 },
							});
						}
					}

					if (benchedNonKeepers.length > 0) {
						// other player changing
						const substitutePlayer = benchedNonKeepers.shift();
						console.log(`Player ${starterNotPlayed.player.short} replaced with player ${substitutePlayer?.player.short}`)
						await prisma.selection.update({
							where: { id: starterNotPlayed.id },
							data: { starting: 0 },
						});
						await prisma.selection.update({
							where: { id: substitutePlayer?.id },
							data: { starting: 1 },
						});
					}
				}
			}
		});
	} catch (err) {
		console.error(err);
	} finally {
		prisma.$disconnect();
	}

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
		},
		cacheStrategy: { ttl: 60 },
	});
	const deadlineWeek = await prisma.week.findFirst({
		where: {
			deadlineDate: {
				gt: new Date()
			}
		},
		orderBy: {
			deadlineDate: 'asc',
		},
		cacheStrategy: { ttl: 60 },
	});
	const displayWeek = await prisma.week.findFirst({
		where: {
			deadlineDate: {
				lt: deadlineWeek?.deadlineDate
			}
		},
		orderBy: {
			deadlineDate: 'desc'
		},
		cacheStrategy: { ttl: 60 },
	});
	rep.send({
		deadlineInfo: {
			deadlineDate: deadlineWeek?.deadlineDate,
			deadlineWeek: deadlineWeek?.id,
			displayWeek: displayWeek?.id || deadlineWeek?.id,
			endWeek: weeks[weeks.length - 1].id,
		},
		weeks
	});
}