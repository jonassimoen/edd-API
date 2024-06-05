import { prisma } from "../db/client"
import { ProcessState } from "@prisma/client";
import { validateStartingLineup } from "../utils/Common";
import HttpError from "../utils/HttpError";
import { isValidLineup } from "../utils/FootballPicker";

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
				const starting = team.selections.filter((sel: any) => sel.starting);
				const startingLineup = starting.reduce((res: number[], cur: any) => {
					res[cur.positionId] = (res[cur.positionId] || 0) + 1;
					return res;
				}, [0,0,0,0,0])

				if(!validateStartingLineup(startingLineup)) {
					throw new HttpError(`Invalid starting lineup for team ${team.id}`, 500);
				}
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
						const substitutePlayer = benchedNonKeepers.shift();
						startingLineup[starterNotPlayed?.player.positionId || 0] -= 1;
						startingLineup[substitutePlayer?.player.positionId || 0] += 1;
						if(validateStartingLineup(startingLineup)) {
							console.log(`Player ${starterNotPlayed.player.short} replaced with player ${substitutePlayer?.player.short}`)
							await prisma.selection.update({
								where: { id: starterNotPlayed.id! },
								data: { starting: 0, order: substitutePlayer?.order },
							});
							await prisma.selection.update({
								where: { id: substitutePlayer?.id! },
								data: { starting: 1, order: starterNotPlayed.order },
							});
						} else {
							benchedNonKeepers.unshift(substitutePlayer!);
						}
					}
				}
			}
		});
	} catch (err) {
		req.log.error(err);
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
	const [weeks, deadlineWeek, displayWeek] = await Promise.all([
		prisma.week.findMany({
			cacheStrategy: {
				ttl: 30,
				swr: 60,
			},
			orderBy: {
				id: 'asc'
			}
		}),
		prisma.week.findFirst({
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
		}),
		prisma.week.findFirst({
			cacheStrategy: {
				ttl: 30,
				swr: 60,
			},
			where: {
				deadlineDate: {
					lt: new Date()
				}
			},
			orderBy: {
				deadlineDate: 'desc'
			},
		})
	]);
	rep.send({
		deadlineInfo: {
			deadlineDate: deadlineWeek?.deadlineDate || 0,
			deadlineWeek: deadlineWeek?.id || 0,
			displayWeek: displayWeek?.id || deadlineWeek?.id,
			endWeek: weeks[weeks.length - 1].id,
			fT: deadlineWeek?.maxTransfers,
			sC: deadlineWeek?.maxSameClub,
		},
		weeks,
		rft: (await prisma.refreshTime.findFirst())?.time
	});
}