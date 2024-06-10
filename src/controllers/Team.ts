import { finalWeekId, upcomingWeekId, validateStartingLineup } from '../utils/Common';
import { prisma } from "../db/client"
import HttpError from "../utils/HttpError";
import { max } from "lodash";

const CheckValidTeam = async (allPlayerIds: number[], reqBody: any, weekId: number, teamId?: number): Promise<{
	value: number,
	playersWithValues: any[],
}> => {
	const [allPlayers, maxSameClub] = await Promise.all([
		await prisma.player.findMany({
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
				selections: {
					select: {
						value: true,
					},
					where: {
						teamId: teamId || 0,
						weekId,
					}
				}
			},
		}),
		(await prisma.week.findFirst({
			select: {
				maxSameClub: true
			},
			where: {
				deadlineDate: {
						gte: new Date()
				}
			},
			orderBy: {
					deadlineDate: 'asc',
			}
		}))?.maxSameClub || 0
	]);
	const playerSelWithValue = allPlayers.map((p: any) => {
		const playerSelection = p.selections && p.selections[0];
		return {...p, value: playerSelection ? playerSelection.value : p.value };
	});
	// Business rules checks
	// 1. Correct positions
	const pos = playerSelWithValue.reduce((res: number[], cur: any) => {
		res[cur.positionId] = (res[cur.positionId] || 0) + 1;
		return res;
	}, [0,0,0,0,0])
	if(pos.toString() !== "0,2,5,5,3") 
		throw new HttpError("Wrong selection of positions", 403);
	// 2. Max players from same club
	const clubs = playerSelWithValue.reduce((res: number[], cur: any) => {
		res[cur.clubId] = (res[cur.clubId] || 0) + 1;
		return res;
	}, [])
	if(clubs.some(count => count > maxSameClub)) {
		throw new HttpError("Too much players of the same club", 403);
	}
	// 3. Within budget
	const totalValue = playerSelWithValue.reduce((prev, curr) => ({ id: 0, value: (prev.value || 0) + (curr.value || 99) }), { id: 0, value: 0 }).value || 0;
	const budget = 100 - totalValue;
	if (budget < 0) {
		throw new HttpError(`Invalid budget (${budget})`, 403);
	}
	// 4. Valid position
	if(validateStartingLineup(playerSelWithValue.reduce((res: number[], cur: any) => {
			res[cur.positionId] = (res[cur.positionId] || 0) + 1;
			return res;
		}, [0,0,0,0,0]))) {
		throw new HttpError('Invalid lineup', 403);
	}
	return {
		value: totalValue,
		playersWithValues: allPlayerIds.map((id: number, index: number) => {
		const player = playerSelWithValue.find((p) => p.id === id);
		return {
			order: index + 1,
			playerId: id,
			value: player?.value || 0,
			captain: (id === reqBody.captainId) ? 1 : (id === reqBody.viceCaptainId ? 2 : 0),
			starting: (reqBody?.starting && player) ? (reqBody.starting.includes(player?.id) ? 1 : 0) : 0,
			weekId,
		}
	})};
}

export const PostAddTeamHandler = async (req: any, rep: any) => {
	if (req.body.bench.length != 4 || req.body.starting.length != 11) {
		throw new HttpError("Invalid team: invalid number of players", 400);
	}
	const allIds = req.body.starting.concat(req.body.bench);

	const [weekId, lastWeekId] = await Promise.all([upcomingWeekId(), finalWeekId()]);

	const {value, playersWithValues} = await CheckValidTeam(allIds, req.body, weekId);
	const allWithValuesForAllRemainingWeeks = playersWithValues!.flatMap((p: any) => Array.from(Array(lastWeekId - weekId + 1).keys()).map(x => x + weekId).map(wId => ({ ...p, weekId: wId })));

	const team = await prisma.team.create({
			data: {
				userId: req.user.id,
				selections: {
					createMany: {
						data: allWithValuesForAllRemainingWeeks,
					}
				},
				budget: 100 - value,
				value: value,
				valid: true,
				created: new Date(Date.now()),
				name: req.body.teamName,
				weekId
			},
			include: {
				selections: true,
				user: true,
			}
		}).then((team) => {
			prisma.audit.create({
				data: {
					userId: req.user.id,
					action: 'POST_CREATE_UPDATE',
					params: JSON.stringify({
						teamId: team.id,
						userId: req.user.id,
						selections: {
							createMany: {
								data: allWithValuesForAllRemainingWeeks,
							}
						},
						budget: 100 - value,
						value: value,
						valid: true,
						created: new Date(Date.now()),
						name: req.body.teamName
					}),
					timestamp: new Date().toISOString(),
				}
			});
			return team;
		});
	rep.send({
		user: team.user,
		team: {
			id: team.id,
			name: team?.name,
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
	const teamWithSelections = await prisma.team.findUnique({
		where: {
			id: +req.params.id,
		},
		select: {
			id: true,
			budget: true,
			created: true,
			name: true,
			points: true,
			rank: true,
			userId: true,
			valid: true,
			value: true,
			weekId: true,
			user: true,
			selections: {
				select: {
					player: true,
					captain: true,
					starting: true,
					value: true,
					playerId: true,
					weekId: true,
					booster: true,
					order: true,
				},
				where: {
					weekId,
				},
				orderBy: {
					order: 'asc'
				}
			},
			Transfer: {
				where: {
					weekId,
				}
			}
		}
	});

	const {selections, Transfer, user, ...team} = teamWithSelections!;
	const invertedSelections = selections?.map((sel: any) => {
		const {player, ...selection} = sel;
		return {
			...player,
			selection,
		};		
	});
	rep.send({
		team,
		players: invertedSelections,
		transfers: Transfer,
		user: user,
	});
}

export const GetPointsTeamHandler = async (req: any, rep: any) => {
	const [
		teamWithSelections, 
		deadlineWeek,
		weeklyData,
		globalData
	]: [any, any, any, any] = await Promise.all([
		prisma.team.findUnique({
			where: {
				id: +req.params.id,
			},
			select: {
				id: true,
				badge: true,
				budget: true,
				created: true,
				name: true,
				points: true,
				rank: true,
				userId: true,
				valid: true,
				value: true,
				weekId: true,
				freeHit: true,
				tripleCaptain: true,
				fanFavourite: true,
				superSubs: true,
				hiddenGem: true,
				goalRush: true,
				user: true,
				Transfer: {
					where: {
						weekId: +req.params.weekId,
					}
				},
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
						player: {
							select: {
								id: true,
								banned: true,
								captain: true,
								clubId: true,
								externalId: true,
								forename: true,
								form: true,
								injury: true,
								name: true,
								portraitUrl: true,
								positionId: true,
								setPieces: true,
								short: true,
								points: true,
								star: true,
								surname: true,
								value: true,
								pSelections: true,
								stats: {
									where: {
										match: {
											weekId: +req.params.weekId,
										}
									}
								}
							}
						},
					},
					where: {
						weekId: +req.params.weekId,
					},
					orderBy: {
						order: 'asc'
					}
				}
			}
		}),

		prisma.week.findFirst({
			cacheStrategy: {
				ttl: 30,
				swr: 60,
			},
			where: {
				id: +req.params.weekId
			}
		}),
		prisma.$queryRaw`SELECT "teamId", CAST(SUM(points) AS int) AS points, CAST(RANK() OVER(ORDER BY SUM(points) DESC) AS int) FROM "Selection" s WHERE "weekId" = ${+req.params.weekId} AND starting = 1 GROUP BY "teamId" ORDER BY rank ASC`,
		prisma.$queryRaw`SELECT "teamId", CAST(SUM(points) AS int) AS points, CAST(RANK() OVER(ORDER BY SUM(points) DESC) AS int) FROM "Selection" s WHERE starting = 1 GROUP BY "teamId" ORDER BY rank ASC`,
	]);
	
	const {selections, Transfer, user, ...team} = teamWithSelections!;
	const invertedSelections = selections?.map((sel: any) => {
		const {player, ...selection} = sel;
		return {
			...player,
			selections: [selection],
		};		
	});

	rep.send({
		players: invertedSelections,
		team: {
			...team,
			rank: globalData.find((teamData: any) => teamData.teamId === +req.params.id)?.rank || 0,
			points: globalData.find((teamData: any) => teamData.teamId === +req.params.id)?.points || 0,
		},
		user: req.user,
		transfers: Transfer,
		weeks: {
			deadlineDate: deadlineWeek?.deadlineDate,
			deadlineWeek: deadlineWeek?.id,
			displayWeek: max([(deadlineWeek?.id || 0) - 1, 0]),
		},
		weekStat: [{
			rank: weeklyData.find((teamData: any) => teamData.teamId === +req.params.id)?.rank || 0,
			points: weeklyData.find((teamData: any) => teamData.teamId === +req.params.id)?.points || 0,
			winner: weeklyData[0]?.points || 0,
			average: weeklyData.reduce((acc: number, curr: any) => curr.points + acc,0) / weeklyData.length,
			teamId: +req.params.id,
			weekId: +req.params.weekId
		}],
	});
}

export const PostBoosterTeamHandler = async (req: any, rep: any) => {
	const boosterUnCC = req.body.type.charAt(0).toUpperCase() + req.body.type.slice(1);
	const validBoosters = ["tripleCaptain","fanFavourite","hiddenGem","goalRush","superSubs","freeHit"];

	if(!validBoosters.includes(req.body.type)) 
		throw new HttpError("Invalid booster", 404)

	const isPlayerBooster = ["hiddenGem","goalRush","fanFavourite"].includes(req.body.type);
	const currentWeek = await upcomingWeekId();

	const teamWithBoosters: { [key: string]: any } | null = await prisma.team.findFirst({
		select: {
			goalRush: true,
			tripleCaptain: true,
			hiddenGem: true,
			fanFavourite: true,
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
	if(teamWithBoosters.selections && teamWithBoosters.selections.length >= 1)
		throw new HttpError("Already used a booster this week", 403)
	
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
			try {
				await prisma.selection.update({
					where: {
						playerId_teamId_weekId: {
							teamId: +req.params.id,
							weekId: currentWeek,
							playerId: req.body.playerId
						},
						captain: 0,
					},
					data: {
						booster: boosterUnCC
					}
				});
			}
			catch {
				throw new HttpError("You can't use a Player Booster on your (vice)captain!", 403);
			}
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

	const [weekId, lastWeekId, team] = await Promise.all([
		upcomingWeekId(),
		finalWeekId(),
		prisma.team.findFirst({
			where: {
				id: +req.params.id
			}
		}),
	]);

	const hasFreeHit = team?.freeHit && (team?.freeHit == weekId)

	if((weekId > +(process.env.OFFICIAL_START_WEEK || 0)) && !hasFreeHit) {
		throw new HttpError("Editing is not allowed anymore.", 400);
	} 

	const allIds = req.body.starting.concat(req.body.bench);

	let {value, playersWithValues} = await CheckValidTeam(allIds, req.body, weekId, +req.params.id);
	let weekIds = [weekId];

	if (!hasFreeHit) {
		// If editing team, all selections should be updated, except if it's for FREE HIT booster. (only 1 gameday!)
		weekIds = Array.from(Array(lastWeekId - weekId + 1).keys()).map(x => x + weekId);
		playersWithValues = playersWithValues!.flatMap((p: any) => weekIds.map(wId => ({ ...p, weekId: wId })));
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
				budget: 100-value,
				value: value,
				selections: {
					createMany: {
						data: playersWithValues!
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
				action: `EDIT_TEAM_${hasFreeHit ? 'FREE_HIT' : 'BEFORE_START'}`,
				params: JSON.stringify({
					teamId: +req.params.id,
					userId: req.user.id,
					selections: playersWithValues,
					budget: 100-value,
					value: value,
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
	const [weekId, lastWeekId] = await Promise.all([upcomingWeekId(), finalWeekId()]);
	const remainingWeekIds = Array.from(Array(lastWeekId - weekId + 1).keys()).map(x => x + weekId);

	if (req.body.bench.length != 4 || req.body.starting.length != 11) {
		throw new HttpError("Invalid team: invalid number of players", 400);
	}
	const allIds = req.body.starting.concat(req.body.bench);
	const {value, playersWithValues} = await CheckValidTeam(allIds, req.body, weekId, +req.params.id);

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
	const [weekId, lastWeekId] = await Promise.all([
		upcomingWeekId(), 
		finalWeekId()
	]);
	const remainingWeekIds = Array.from(Array(lastWeekId - weekId + 1).keys()).map(x => x + weekId);

	if (transfers) {
		const alreadyPerformedTransfers = await prisma.transfer.findMany({
			where: {
				teamId: +req.params.id,
				weekId,
			}
		});
		const allTfIds = (await prisma.selection.findMany({
				where: {
					teamId: +req.params.id,
					weekId: weekId,
				},
				select: {
					playerId: true
				},
				orderBy: {
					order: 'asc'
				}
			})).map((n: { playerId: number; }) => {
				const tf = transfers.find((t: any) => t.outId === n.playerId);
				return tf ? tf.inId : n.playerId;
			});
		const {value, playersWithValues } = await CheckValidTeam(allTfIds, req.body, weekId, +req.params.id);

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
			await prisma.team.update({
				where: {
					id: +req.params.id,
				},
				data: {
					budget: 100-value,
					value: value,
				}
			})
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