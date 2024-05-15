import { finalWeekId, upcomingWeekId } from '../utils/Common';
import { prisma } from "../db/client"
import HttpError from "../utils/HttpError";
import { max } from "lodash";
import { isValidLineup } from '../utils/FootballPicker';

const GetPlayerByIds = async (allPlayerIds: number[], reqBody: any, weekId: number, skipReturn?: boolean) => {
	const allPlayers = await prisma.player.findMany({
		where: {
			id: {
				in: allPlayerIds
			}
		},
		select: {
			id: true,
			clubId: true,
			positionId: true,
			value: true,
		},
	});
	console.log(allPlayers);

	// Business rules checks
	// 1. Correct positions
	const pos = allPlayers.reduce((res: number[], cur: any) => {
		res[cur.positionId] = (res[cur.positionId] || 0) + 1;
		return res;
	}, [0,0,0,0,0])
	if(pos.toString() !== "0,2,5,5,3") 
		throw new HttpError("Wrong selection of positions", 403);
	// 2. Max 3 players from club
	const clubs = allPlayers.reduce((res: number[], cur: any) => {
		res[cur.clubId] = (res[cur.clubId] || 0) + 1;
		return res;
	}, [])
	if(clubs.some(count => count > 3)) {
		throw new HttpError("Too much player of same club", 403);
	}
	// 3. Within budget
	const totalValue = allPlayers.reduce((prev, curr) => ({ id: 0, value: (prev.value || 0) + (curr.value || 0) }), { id: 0, value: 0 }).value || 0;
	const budget = 100 - totalValue;
	if (budget <= 0) {
		throw new HttpError(`Invalid budget (${budget})`, 403);
	}
	// 4. Valid position
	if(!isValidLineup(allPlayers.filter(p => allPlayerIds.slice(0,11).indexOf(p.id) > -1 ))) {
		throw new HttpError('Invalid lineup', 403);
	}
	if(skipReturn) {
		return;
	}

	return allPlayerIds.map((id: number, index: number) => {
		const player = allPlayers.find((p) => p.id === id);
		return {
			order: index + 1,
			playerId: id,
			value: player?.value || 0,
			captain: (id === reqBody.captainId) ? 1 : (id === reqBody.viceCaptainId ? 2 : 0),
			starting: player ? (reqBody.starting.includes(player?.id) ? 1 : 0) : 0,
			weekId,
		}
	});
}

export const PostAddTeamHandler = async (req: any, rep: any) => {
	if (req.body.bench.length != 4 || req.body.starting.length != 11) {
		throw new HttpError("Invalid team: invalid number of players", 400);
	}
	const allIds = req.body.starting.concat(req.body.bench);

	const weekId = await upcomingWeekId();
	const lastWeekId = await finalWeekId();

	const allWithValues = await GetPlayerByIds(allIds, req.body, weekId);

	const totalValue = allWithValues!.reduce((prev, curr) => ({ id: 0, value: (prev.value || 0) + (curr.value || 0) }), { id: 0, value: 0 }).value || 0;
	const budget = 100 - totalValue;
	const allWithValuesForAllRemainingWeeks = allWithValues!.flatMap((p: any) => Array.from(Array(lastWeekId - weekId + 1).keys()).map(x => x + weekId).map(wId => ({ ...p, weekId: wId })));

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
		status: "success"
	});
}

export const PostCopyTeamHandler = async (req: any, rep: any) => {

}

export const DeleteDropTeamHandler = async (req: any, rep: any) => {

}

export const GetTeamHandler = async (req: any, rep: any) => {
	const weekId = await upcomingWeekId();
	const playersWithMultipleSelections = await prisma.player.findMany({
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
					order: true,
				},
			}
		},
	});
	const players = playersWithMultipleSelections.sort((a, b) => a.selections[0].order! - b.selections[0].order!)
	.map(({ selections, ...rest }) => {
		const {order, ...sel} = selections[0];
		return {
			...rest,
			selection: sel
		}
	})

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
					order: true,
				},
				where: {
					teamId: +req.params.id,
					weekId: +req.params.weekId,
				},
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
		},
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
		players: players.sort((a, b) => a.selections[0].order! - b.selections[0].order!),
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
	const validBoosters = ["tripleCaptain","viceVictory","hiddenGem","goalRush","superSubs"];

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

	if (req.body.bench?.length != 4 || req.body.starting?.length != 11) {
		throw new HttpError("Invalid team: invalid number of players", 400);
	}
	const weekId = await upcomingWeekId();
	const lastWeekId = await finalWeekId();
	const team = await prisma.team.findFirst({
		where: {
			id: +req.params.id
		}
	});

	let type = 'BEFORE_START'

	if(weekId > +(process.env.OFFICIAL_START_WEEK || 0)) {
		throw new HttpError("Editing is not allowed anymore.", 400);
	} 

	if(team?.freeHit && (team?.freeHit == weekId)) {
		type = 'FREE_HIT'
	}

	const allIds = req.body.starting.concat(req.body.bench);

	let allWithValues = await GetPlayerByIds(allIds, req.body, weekId);
	let weekIds = [weekId];

	const totalValue = allWithValues!.reduce((prev, curr) => ({ id: 0, value: (prev.value || 0) + (curr.value || 0) }), { id: 0, value: 0 }).value || 0;
	const budget = 100 - totalValue;

	if (budget <= 0) {
		throw new HttpError(`Invalid team: invalid budget (${budget})`, 400);
	}	

	if (type !== 'FREE_HIT') {
		// If editing team, all selections should be updated, except if it's for FREE HIT booster. (only 1 gameday!)
		weekIds = Array.from(Array(lastWeekId - weekId + 1).keys()).map(x => x + weekId);
		allWithValues = allWithValues!.flatMap((p: any) => weekIds.map(wId => ({ ...p, weekId: wId })));
	}

	const [deletion, updatedTeam, audit] = await prisma.$transaction([
		prisma.selection.deleteMany({
			where: {
				teamId: +req.params.id,
				weekId: {
					in: weekIds
				}
			}
		}),
		prisma.team.update({
			where: {
				id: +req.params.id
			},
			data: {
				name: req.body.teamName,
				valid: true,
				selections: {
					createMany: {
						data: allWithValues!
					}
				}
			},
			include: {
				selections: true,
				user: true,
			}
		}),
		prisma.audit.create({
			data: {
				userId: req.user.id,
				action: `EDIT_TEAM_${type}`,
				params: JSON.stringify({
					userId: req.user.id,
					selections: allWithValues,
					budget: budget,
					value: totalValue,
					valid: true,
					created: new Date(Date.now()),
					name: req.body.teamName
				}),
				timestamp: new Date().toISOString(),
			}
		})
	]);
	rep.send({
		message: "Team successfully updated."
	});
}

export const PostSelectionsTeamHandler = async (req: any, rep: any) => {
	const weekId = await upcomingWeekId();
	const lastWeekId = await finalWeekId();
	const remainingWeekIds = Array.from(Array(lastWeekId - weekId + 1).keys()).map(x => x + weekId);

	if (req.body.bench.length != 4 || req.body.starting.length != 11) {
		throw new HttpError("Invalid team: invalid number of players", 400);
	}
	const allIds = req.body.starting.concat(req.body.bench);
	const allWithValues = await GetPlayerByIds(allIds, req.body, weekId);

	try {
		await prisma.$transaction( async (prisma) => {
			await Promise.all(req.body.starting.map((startingPlayerId: number, index: number) =>
				prisma.selection.updateMany({
					where: {
						playerId: startingPlayerId,
						teamId: +req.params.id,
						weekId: {
							in: remainingWeekIds
						},
					},
					data: {
						order: index + 1,
						starting: 1,
						captain: (startingPlayerId === req.body.captainId ? 1 : (startingPlayerId === req.body.viceCaptainId ? 2 : 0)),
					}
				})
			));
			await Promise.all(req.body.bench.map(async (benchPlayerId: number, index: number) =>
				await prisma.selection.updateMany({
					where: {
						playerId: benchPlayerId,
						teamId: +req.params.id,
						weekId: {
							in: remainingWeekIds
						},
					},
					data: {
						order: index + 12,
						starting: 0,
						captain: (benchPlayerId === req.body.captainId ? 1 : (benchPlayerId === req.body.viceCaptainId ? 2 : 0)),
					}
				})
			));
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
		const allTfIds = (await prisma.selection.findMany({
				where: {
					teamId: +req.params.id,
					weekId: weekId,
				},
				select: {
					playerId: true
				}
			})).map((n: { playerId: number; }) => {
				const tf = transfers.find((t: any) => t.outId === n.playerId);
				return tf ? tf.inId : n.playerId;
			});
		await GetPlayerByIds(allTfIds, req.body, weekId, true);

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
			await Promise.all(transfers.map(async (transfer: any) =>
				await prisma.selection.updateMany({
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
			));
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
			SELECT u."firstName", u."lastName", u.id as "userId", t.id as "teamId", t.name, t.points, (RANK() OVER(ORDER BY SUM(t.points) DESC))::INTEGER 
			FROM "Team" t 
			JOIN "User" u ON u.id = t."userId"
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