import { prisma } from "../db/client"
import { ProcessState } from "@prisma/client";

export const GetWeeksHandler = async (req: any, rep: any) => {
	const weeks = await prisma.week.findMany({
		cacheStrategy: {
			ttl: 30,
			swr: 60,
		},
		orderBy: {
			id: 'asc'
		}
	});
	rep.send(weeks);
}

export const GetWeekHandler = async (req: any, rep: any) => {
	const week = await prisma.week.findUnique({
		cacheStrategy: {
			ttl: 30,
			swr: 60,
		},
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
	const weekId = +req.params.id;
	const statsSumPoints = await prisma.statistic.groupBy({
		cacheStrategy: {
			ttl: 30,
			swr: 60,
		},
		where: {
			match: {
				weekId
			}
		},
		by: ['playerId'],
		_sum: {
			points: true,
		}
	});

	const teamPoints = await prisma.selection.groupBy({
		cacheStrategy: {
			ttl: 30,
			swr: 60,
		},
		where: {
			weekId,
			starting: 1,
		},
		by: ['teamId'],
		_sum: {
			points: true
		}
	});

	const teamsWithSelections = await prisma.team.findMany({
		cacheStrategy: {
			ttl: 30,
			swr: 60,
		},
		include: {
			selections: {
				where: {
					weekId
				},
				include: {
					player: {
						select: {
							positionId: true,
							short: true,
						}
					},
				},
				orderBy: {
					order: 'asc',
				}
			}
		}
	});
	try {
		await prisma.$transaction(async (prisma) => {

			for (const team of teamsWithSelections) {
				const startersNotPlaying = team.selections.filter((sel: any) => sel.starting && !sel.played);
				const benchersPlayed = team.selections.filter((sel: any) => !sel.starting && sel.played);

				const benchedKeeper = benchersPlayed.find((sel: any) => sel.player.positionId === 1);
				const benchedNonKeepers = benchersPlayed.filter((sel: any) => sel.player.positionId !== 1);

				console.log(`Team #${team.id} has ${team.selections.length} selections in week ${weekId}, ${startersNotPlaying.length} starters did not play, ${benchersPlayed.length} bench players did play`);
				for (const starterNotPlayed of startersNotPlaying) {

					// keeper changing
					if (starterNotPlayed.player.positionId === 1) {
						if (benchedKeeper?.played) {
							console.log(`Keeper ${starterNotPlayed.player.short} replaced with keeper ${benchedKeeper?.player.short}`)
							await prisma.selection.update({
								where: { id: starterNotPlayed.id! },
								data: { starting: 0, order: benchedKeeper.order },
							});
							await prisma.selection.update({
								where: { id: benchedKeeper.id! },
								data: { starting: 1, order: starterNotPlayed.order },
							});
						}
					}

					else if (benchedNonKeepers.length > 0) {
						// other player changing
						// TODO: check if valid lineup
						const substitutePlayer = benchedNonKeepers.shift();
						console.log(`Player ${starterNotPlayed.player.short} replaced with player ${substitutePlayer?.player.short}`)
						await prisma.selection.update({
							where: { id: starterNotPlayed.id! },
							data: { starting: 0, order: substitutePlayer?.order },
						});
						await prisma.selection.update({
							where: { id: substitutePlayer?.id! },
							data: { starting: 1, order: starterNotPlayed.order },
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
				id: weekId,
			},
			data: {
				validated: true,
				Match: {
					updateMany: {
						where: {
							weekId: weekId
						},
						data: {
							status: ProcessState.VALIDATED
						},
					},
				},
			}
		}),
		// Captain - Vice Captain points multipliers (Triple Captain / Vice victory)
		prisma.$queryRaw`CALL "calculateTeamAndPlayerPoints"(${weekId})`
	]);
	rep.send(updatedWeek);
}

export const DeleteWeekHandler = async (req: any, rep: any) => {

}
export const GetDeadlineInfoHandler = async (req: any, rep: any) => {
	const weeks = await prisma.week.findMany({
		cacheStrategy: {
			ttl: 30,
			swr: 60,
		},
		orderBy: {
			id: 'asc'
		}
	});
	const deadlineWeek = await prisma.week.findFirst({
		cacheStrategy: {
			ttl: 30,
			swr: 60,
		},
		where: {
			deadlineDate: {
				gt: new Date()
			}
		},
		orderBy: {
			deadlineDate: 'asc',
		}
	});
	const displayWeek = await prisma.week.findFirst({
		cacheStrategy: {
			ttl: 30,
			swr: 60,
		},
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
			deadlineDate: deadlineWeek?.deadlineDate || 0,
			deadlineWeek: deadlineWeek?.id || 0,
			displayWeek: displayWeek?.id || deadlineWeek?.id,
			endWeek: weeks[weeks.length - 1].id,
		},
		weeks,
		rft: (await prisma.refreshTime.findFirst())?.time
	});
}