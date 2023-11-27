import { finalWeekId, upcomingWeekId } from '@/utils/Common';
import { prisma } from "@db/client"
import HttpError from "@utils/HttpError";
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
						captain: (id === req.body.captainId) ? 1 : (id === req.body.viceCaptainId ? 2 : 0) ,
						starting: player ? (req.body.starting.includes(player?.id) ? 1 : 0) : 0,
						weekId,
				}
		});

		const totalValue = all.reduce((prev, curr) => ({ id: 0, value: (prev.value || 0) + (curr.value || 0) }), { id: 0, value: 0 }).value || 0;
		const budget = 100 - totalValue;

		if (budget <= 0) {
				throw new HttpError(`Invalid team: invalid budget (${budget})`, 400);
		}

		const allWithValuesForAllRemainingWeeks = allWithValues.flatMap((p: any) => Array.from(Array(lastWeekId - weekId + 1).keys()).map(x => x + weekId).map( wId => ({...p, weekId: wId}) ));		

		const team = await prisma.team.create({
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
		});
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
								}
						}
				}
		});
		const players = playersWithMultipleSelections.map(({ selections, ...rest }) => ({
				...rest,
				selection: selections[0]
		})).sort((p1, p2) => (p2.selection.starting !== p1.selection.starting) ? (p2.selection.starting - p1.selection.starting) : ((p1.positionId || 0) - (p2.positionId || 0)));
		const team = await prisma.team.findFirst({
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
		rep.send({ team: { ...team, freeHit: 0, bank: 0, tripleCaptain: 0, wildCard: 0 }, players, transfers: transfers });
}

export const GetPointsTeamHandler = async (req: any, rep: any) => {
		const players = await prisma.player.findMany({
				include: {
						selections: {
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
		const team = await prisma.team.findUnique({
				where: {
						id: +req.params.id,
				}
		});
		const deadlineWeek = await prisma.week.findFirst({
				where: {
						id: +req.params.weekId
				}
		});
		const transfers = await prisma.transfer.findMany({
				where: {
						teamId: +req.params.id,
						weekId: +req.params.weekId,
				}
		});
		rep.send({
				players,
				team,
				user: req.user,
				transfers: transfers,
				weeks: {
						deadlineDate: deadlineWeek?.deadlineDate,
						deadlineWeek: deadlineWeek?.id,
						displayWeek: max([(deadlineWeek?.id || 0) - 1, 0]),
				},
				// todo: replace weekstat
				weekStat: [{
						points: players.filter((p: any) => p.selections[0].starting === 1).reduce((acc: number, p: any) => acc + (p.stats[0]?.points || 0), 0),
						rank: 1564,
						teamId: +req.params.id,
						value: 69,
						weekId: +req.params.weekId
				}],
		});
}

export const PostBoosterTeamHandler = async (req: any, rep: any) => {

}

export const PostNameTeamHandler = async (req: any, rep: any) => {
}

export const PostEditTeamHandler = async (req: any, rep: any) => {

}

export const PostSelectionsTeamHandler = async (req: any, rep: any) => {
		const weekId = await upcomingWeekId();
		try {
				await prisma.$transaction(
						[].concat(
								req.body.starting.map((startingPlayerId: number) =>
										prisma.selection.update({
												where: {
														playerId_teamId_weekId: {
																playerId: startingPlayerId,
																teamId: +req.params.id,
																weekId,
														}
												},
												data: {
														starting: 1
												}
										})
								),
								req.body.bench.map((benchPlayerId: number) =>
										prisma.selection.update({
												where: {
														playerId_teamId_weekId: {
																playerId: benchPlayerId,
																teamId: +req.params.id,
																weekId,
														}
												},
												data: {
														starting: 0
												}
										})
								),
						)
				);
				rep.send({ msg: "Ploeg is aangepast." });
		} catch (e) {
				rep.status(406).send(e);
		}
}

export const PostTransfersTeamHandler = async (req: any, rep: any) => {
		const transfers = req.body.transfers;
		const weekId = await upcomingWeekId();
		if (transfers) {
				const transferCreateInput = transfers.map((transfer: any) => {
						return {
								teamId: +req.params.id,
								weekId,
								datetime: new Date(Date.now()),
								inId: transfer.inId,
								outId: transfer.outId,
						}
				});
				const transfersRecord = await prisma.transfer.createMany({
						data: transferCreateInput
				});
				updateTeamSelection(+req.params.id, weekId, transfers);
				rep.send({ msg: `${transfersRecord.count} player${transfersRecord.count > 1 ? 's' : ''} transferred` });
				// rep.send();
		} else {

		}

		// TODO: replace player in selections
}

export const PostResetTransfersTeamHandler = async (req: any, rep: any) => {

}

export const PostBadgeHandler = async (req: any, rep: any) => {

}

const updateTeamSelection = async (teamId: number, weekId: number, transfers: any[]) => {
		const currentSelection = await prisma.selection.findMany({
				where: {
						teamId,
						weekId,
				}
		});
		const outIds = transfers.map((tf: any) => tf.outId);
		if (currentSelection && currentSelection.length > 0) {
				// This team already has a selection for this week. So only update the transfers.
				await prisma.$transaction(
						currentSelection
								.filter((selection: any) => outIds.indexOf(selection.playerId) != -1)
								.map((selection: any) =>
										prisma.selection.update({
												where: {
														playerId_teamId_weekId: {
																teamId,
																weekId,
																playerId: selection.playerId,
														}
												},
												data: {
														player: {
																connect: {
																		id: transfers.find((transfer: any) => transfer.outId === selection.playerId).inId
																}
														}
												}
										})
								)
				);

		} else {
				const newWeekId = weekId;
				// This team has no player selections for this week. Copy them from last week.
				const lastWeekSelection = await prisma.selection.findMany({
						where: {
								teamId,
								weekId: weekId - 1,
						}
				});
				const inputData = lastWeekSelection
						.filter((selection: any) => outIds.indexOf(selection.playerId) === -1)
						.concat(
								lastWeekSelection.filter((selection: any) => outIds.indexOf(selection.playerId) !== -1).map(
										(transferredOutPlayer) => ({
												...transferredOutPlayer,
												playerId: transfers.find((tf: any) => tf.outId === transferredOutPlayer.playerId).inId,
										})
								)
						)
						.map((selection: any) => {
								const { id, weekId, ...data } = selection;
								return { weekId: newWeekId, ...data };
						});
				console.log(weekId);
				await prisma.selection.createMany({
						data: inputData,
				})
				// .map((selection: any) =>
				//		 ({
				//				 "selection.playerId": selection.playerId,
				//				 "newPlayer.playerId": transfers.find((transfer: any) => transfer.outId === selection.playerId).inId,
				//				 where: {
				//						 playerId_teamId_weekId: {
				//								 teamId,
				//								 weekId,
				//								 playerId: selection.playerId,
				//						 }
				//				 },
				//				 data: {
				//						 player: {
				//								 connect: {
				//										 id: transfers.find((transfer: any) => transfer.outId === selection.playerId).inId
				//								 }
				//						 }
				//				 }
				//		 })
		}
}