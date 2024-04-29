import { finalWeekId, upcomingWeekId } from '../utils/Common';
import { prisma } from "../db/client"
import HttpError from "../utils/HttpError";
import { max } from "lodash";

export const PostAddTeamHandler = async (req: any, rep: any) => {

	if (req.body.bench.length != 4 || req.body.starting.length != 11) {
		throw new HttpError("Invalid team: invalid number of players", 400);
	}
	const allIds = req.body.starting.concat(req.body.bench);
	const all = await prisma.player.findMany({
		where: {
			id: {
				in: allIds
			}
		},
		select: {
			id: true,
			value: true,
		}
	});

	const weekId = await upcomingWeekId();
	const lastWeekId = await finalWeekId();

	const allWithValues = allIds.map((id: number) => {
		const player = all.find((p) => p.id === id);
		return {
			playerId: id,
			value: (player ? player.value : 0),
			captain: (id === req.body.captainId) ? 1 : (id === req.body.viceCaptainId ? 2 : 0),
			starting: player ? (req.body.starting.includes(player?.id) ? 1 : 0) : 0,
			weekId,
		}
	});

	const totalValue = all.reduce((prev, curr) => ({ id: 0, value: (prev.value || 0) + (curr.value || 0) }), { id: 0, value: 0 }).value || 0;
	const budget = 100 - totalValue;

	if (budget <= 0) {
		throw new HttpError(`Invalid team: invalid budget (${budget})`, 400);
	}

	const allWithValuesForAllRemainingWeeks = allWithValues.flatMap((p: any) => Array.from(Array(lastWeekId - weekId + 1).keys()).map(x => x + weekId).map(wId => ({ ...p, weekId: wId })));

	const [team, audit] = await prisma.$transaction([
		prisma.team.create({
			data: {
				userId: req.user.id,
				selections: {
					createMany: {
						data: allWithValuesForAllRemainingWeeks,
					}
				},
				budget: budget,
				value: totalValue,
				valid: true,
				created: new Date(Date.now()),
				name: req.body.teamName
			},
			include: {
				selections: true,
				user: true,
			}
		}),
		prisma.audit.create({
			data: {
				userId: req.user.id,
				action: 'POST_CREATE_UPDATE',
				params: JSON.stringify({
					userId: req.user.id,
					selections: {
						createMany: {
							data: allWithValuesForAllRemainingWeeks,
						}
					},
					budget: budget,
					value: totalValue,
					valid: true,
					created: new Date(Date.now()),
					name: req.body.teamName
				}),
				timestamp: new Date().toISOString(),
			}
		})
	])
	rep.send({
		user: team.user,
		team: {
			id: team.id,
			name: team.name,
		},
		players: team.selections.map(selection => selection.id)
	});
}

export const PostCopyTeamHandler = async (req: any, rep: any) => {

}

export const DeleteDropTeamHandler = async (req: any, rep: any) => {

}

export const GetTeamHandler = async (req: any, rep: any) => {
	const weekId = await upcomingWeekId();
	const playersWithMultipleSelections = await prisma.player.findMany({
		cacheStrategy: {
			ttl: 30,
			swr: 60,
		},
		where: {
			selections: {
				some: {
					teamId: +req.params.id,
					weekId,
				}
			}
		},
		include: {
			selections: {
				where: {
					teamId: +req.params.id,
					weekId,
				},
				select: {
					captain: true,
					starting: true,
					value: true,
					playerId: true,
					weekId: true,
					booster: true,
				}
			}
		}
	});
	const players = playersWithMultipleSelections.map(({ selections, ...rest }) => ({
		...rest,
		selection: selections[0]
	})).sort((p1, p2) => (p2.selection.starting !== p1.selection.starting) ? (p2.selection.starting - p1.selection.starting) : ((p1.positionId || 0) - (p2.positionId || 0)));

	const team = await prisma.team.findFirst({
		cacheStrategy: {
			ttl: 30,
			swr: 60,
		},
		where: {
			id: +req.params.id
		},
		include: {
			user: true
		}
	});

	const transfers = await prisma.transfer.findMany({
		cacheStrategy: {
			ttl: 30,
			swr: 60,
		},
		where: {
			teamId: +req.params.id,
			weekId,
		}
	})
	rep.send({ team: { ...team }, players, transfers: transfers });
}

export const GetPointsTeamHandler = async (req: any, rep: any) => {
	const team = await prisma.team.findUnique({
		cacheStrategy: {
			ttl: 30,
			swr: 60,
		},
		where: {
			id: +req.params.id,
		}
	});
	if(!team) {
		rep.status(404);
	}
	const players = await prisma.player.findMany({
		cacheStrategy: {
			ttl: 30,
			swr: 60,
		},
		include: {
			selections: {
				select: {
					captain: true,
					starting: true,
					value: true,
					playerId: true,
					weekId: true,
					booster: true,
					played: true,
					endWinnerSelections: true,
					points: true,
				},
				where: {
					teamId: +req.params.id,
					weekId: +req.params.weekId,
				}
			},
			stats: {
				where: {
					match: {
						weekId: +req.params.weekId,
					}
				}
			}
		},
		where: {
			selections: {
				some: {
					teamId: +req.params.id,
					weekId: +req.params.weekId,
				}
			}
		}
	});
	const deadlineWeek = await prisma.week.findFirst({
		cacheStrategy: {
			ttl: 30,
			swr: 60,
		},
		where: {
			id: +req.params.weekId
		}
	});
	const transfers = await prisma.transfer.findMany({
		cacheStrategy: {
			ttl: 30,
			swr: 60,
		},
		where: {
			teamId: +req.params.id,
			weekId: +req.params.weekId,
		}
	});
	const weeklyData: [{ teamId: number, points: number, rank: number }] = await prisma.$queryRaw`SELECT "teamId", CAST(SUM(points) AS int) AS points, CAST(RANK() OVER(ORDER BY SUM(points) DESC) AS int) FROM "Selection" s WHERE "weekId" = ${+req.params.weekId} AND starting = 1 GROUP BY "teamId" ORDER BY rank ASC`;
	const globalData: [{ teamId: number, points: number, rank: number }] = await prisma.$queryRaw`SELECT "teamId", CAST(SUM(points) AS int) AS points, CAST(RANK() OVER(ORDER BY SUM(points) DESC) AS int) FROM "Selection" s WHERE starting = 1 GROUP BY "teamId" ORDER BY rank ASC`;

	rep.send({
		players,
		team: {
			...team,
			rank: globalData.find((teamData: any) => teamData.teamId === +req.params.id)?.rank || 0,
			points: globalData.find((teamData: any) => teamData.teamId === +req.params.id)?.points || 0,
		},
		user: req.user,
		transfers: transfers,
		weeks: {
			deadlineDate: deadlineWeek?.deadlineDate,
			deadlineWeek: deadlineWeek?.id,
			displayWeek: max([(deadlineWeek?.id || 0) - 1, 0]),
		},
		// todo: replace weekstat
		weekStat: [{
			rank: weeklyData.find((teamData: any) => teamData.teamId === +req.params.id)?.rank || 0,
			points: weeklyData.find((teamData: any) => teamData.teamId === +req.params.id)?.points || 0,
			winner: weeklyData[0]?.points || 0,
			average: weeklyData.reduce((acc: number, curr: any) => curr.points + acc,0) / weeklyData.length,
			teamId: +req.params.id,
			value: 69,
			weekId: +req.params.weekId
		}],
	});
}

export const PostBoosterTeamHandler = async (req: any, rep: any) => {
	const boosterUnCC = req.body.type.charAt(0).toUpperCase() + req.body.type.slice(1);
	const validBoosters = ["tripleCaptain","viceVictory","hiddenGem","goalRush"];

	if(!validBoosters.includes(req.body.type)) 
		throw new HttpError("Invalid booster", 404)

	const isPlayerBooster = ["hiddenGem","goalRush"].includes(req.body.type);
	const currentWeek = await upcomingWeekId();

	const teamWithBoosters: { [key: string]: any } | null = await prisma.team.findFirst({
		select: {
			goalRush: true,
			tripleCaptain: true,
			hiddenGem: true,
			viceVictory: true,
			selections: {
				select: {
					playerId: true,
					booster: true,
				},
				where: {
					booster: {
						not: null
					},
					weekId: currentWeek,
				}
			}
		},
		where: {
			id: +req.params.id,
		}
	});
	
	if(!teamWithBoosters)
		throw new HttpError("No team found", 404)
	if(teamWithBoosters[req.body.type])
		throw new HttpError("Booster already used", 403)
	if(teamWithBoosters.selections && teamWithBoosters.selections.length >= 2)
		throw new HttpError("Already 2 boosters this week", 403)
	
	await prisma.$transaction(async (prisma) => {
		await prisma.team.update({
			data: {
				[req.body.type]: currentWeek
			},
			where: {
				id: +req.params.id
			}
		});

		if(isPlayerBooster) {
			await prisma.selection.update({
				where: {
					playerId_teamId_weekId: {
						teamId: +req.params.id,
						weekId: currentWeek,
						playerId: req.body.playerId
					}
				},
				data: {
					booster: boosterUnCC
				}
			})
		}

		await prisma.audit.create({
			data: {
				userId: req.user.id,
				action: 'POST_PERFORM_BOOSTER',
				params: JSON.stringify({
					teamId: +req.params.id,
					type: req.body.type,
					weekId: currentWeek,
					playerId: req.body.playerId || "none",
				}),
				timestamp: new Date().toISOString(),
			}
		});
	})
	rep.send({"message":"Booster activated successfully."})
}

export const PostNameTeamHandler = async (req: any, rep: any) => {
}

export const PostEditTeamHandler = async (req: any, rep: any) => {

}

export const PostSelectionsTeamHandler = async (req: any, rep: any) => {
	const weekId = await upcomingWeekId();
	const lastWeekId = await finalWeekId();
	const remainingWeekIds = Array.from(Array(lastWeekId - weekId + 1).keys()).map(x => x + weekId);

	try {
		await prisma.$transaction( async (prisma) => {
			await req.body.starting.map((startingPlayerId: number) =>
				prisma.selection.updateMany({
					where: {
						playerId: startingPlayerId,
						teamId: +req.params.id,
						weekId: {
							in: remainingWeekIds
						},
					},
					data: {
						starting: 1,
						captain: (startingPlayerId === req.body.captainId ? 1 : (startingPlayerId === req.body.viceCaptainId ? 2 : 0)),
					}
				})
			);
			await req.body.bench.map((benchPlayerId: number) =>
				prisma.selection.updateMany({
					where: {
						playerId: benchPlayerId,
						teamId: +req.params.id,
						weekId: {
							in: remainingWeekIds
						},
					},
					data: {
						starting: 0,
						captain: (benchPlayerId === req.body.captainId ? 1 : (benchPlayerId === req.body.viceCaptainId ? 2 : 0)),
					}
				})
			);
			await prisma.audit.create({
				data: {
					userId: req.user.id,
					action: 'POST_TEAM_SELECTION',
					params: JSON.stringify({
						teamId: +req.params.id,
						weekId: weekId,
						weekIds: remainingWeekIds,
						starting: req.body.starting,
						bench: req.body.bench,
					}),
					timestamp: new Date().toISOString(),
				}
			});
		});
		rep.send({ msg: "Ploeg is aangepast." });
	} catch (e) {
		rep.status(406).send(e);
	}
}

export const PostTransfersTeamHandler = async (req: any, rep: any) => {
	const transfers = req.body.transfers;
	const weekId = await upcomingWeekId();
	const lastWeekId = await finalWeekId();
	const remainingWeekIds = Array.from(Array(lastWeekId - weekId + 1).keys()).map(x => x + weekId);

	if (transfers) {
		const alreadyPerformedTransfers = await prisma.transfer.findMany({
			where: {
				teamId: +req.params.id,
				weekId,
			}
		});

		if(process.env.MAX_TRANSFERS && (transfers.length + alreadyPerformedTransfers.length) > +process.env.MAX_TRANSFERS) {
			rep.status(403).send({ msg: "Whoaaa, too much transfers!" });
			return;
		}
		const transferCreateInput = transfers.map((transfer: any) => {
			return {
				teamId: +req.params.id,
				weekId,
				datetime: new Date(Date.now()),
				inId: transfer.inId,
				outId: transfer.outId,
			}
		});
		await prisma.$transaction( async (prisma) => {
			await prisma.transfer.createMany({
				data: transferCreateInput
			});
			await transfers.map((transfer: any) =>
				prisma.selection.updateMany({
					where: {
						playerId: transfer.outId,
						teamId: +req.params.id,
						weekId: {
							in: remainingWeekIds
						},
					},
					data: {
						playerId: transfer.inId
					}
				})
			);
			await prisma.audit.create({
				data: {
					userId: req.user.id,
					action: 'POST_TRANSFERS',
					params: JSON.stringify({
						teamId: +req.params.id,
						weekId: weekId,
						weekIds: remainingWeekIds,
						transfers: transfers,
					}),
					timestamp: new Date().toISOString(),
				}
			});
		});
		rep.send({ msg: "Transfers toegekend" });
	} else {
		rep.status(406).send({ msg: "No transfers included." });
	}
}

export const PostResetTransfersTeamHandler = async (req: any, rep: any) => {

}

export const PostBadgeHandler = async (req: any, rep: any) => {

}

export const GetRankingHandler = async (req: any, rep: any) => {
	const result: any[] = await prisma.$queryRaw`
			SELECT u."firstName", u."lastName", u.id as "userId", t.id as "teamId", t.name, SUM(s.points)::INTEGER as points, (RANK() OVER(ORDER BY SUM(s.points) DESC))::INTEGER 
			FROM "Selection" s 
			JOIN "Team" t ON t.id = s."teamId"
			JOIN "User" u ON u.id = t."userId"
			WHERE s.starting = 1
			GROUP BY t.id, u.id
		`;
	const mappedResult = result.map((team: any) => ({
		team: {
			id: team.teamId,
			points: team.points,
			rank: team.rank,
			name: team.name,
		},
		user: {
			id: team.userId,
			firstName: team.firstName,
			lastName: team.lastName,
		}
	}));
	rep.send(mappedResult);
}