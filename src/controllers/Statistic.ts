import { calculatePoints } from "../utils/PointsCalculator";
import { prisma } from "../db/client"
import { ProcessState, Statistic } from "@prisma/client";
import HttpError from "../utils/HttpError";
import axios from "axios";
import { pick, pickBy } from "lodash";
import { upcomingWeekId } from "../utils/Common";

export const GetPlayerStatisticsHandler = async (req: any, rep: any) => {
	const selectionMaxWeekId = await upcomingWeekId();

	const totalTeams = (await prisma.selection.groupBy({
		by: ['teamId','weekId'],
		where: {
			weekId: {
				lte: selectionMaxWeekId,
			}
		}
	})).length;

	const matchdayFilter = req.query.matchday ? { id: { equals: +req.query.matchday } } : { validated: true }
	
	const players = await prisma.player.findMany({
		cacheStrategy: {
			ttl: 300,
			swr: 120,
		},
		include: {
			stats: {
				where: {
					match: {
						week: matchdayFilter
					}
				}
			},
			selections: {
				where: {
					weekId: {
						lte: selectionMaxWeekId
					}
				}
			},
			club: true
		},
	});

	const allStatsPlayers = players.map((player: any) => {
		const sumStats = player.stats.reduce((sum: any, current: any) => ({
			statMinutesPlayed: sum.statMinutesPlayed + current.minutesPlayed,
			statMatchesPlayed: sum.statMatchesPlayed + 1,
			statAssists: sum.statAssists + current.assists,
			statGoals: sum.statGoals + current.goals,
			statReds: sum.statReds + +current.red,
			statYellows: sum.statYellows + +current.yellow,
			statShots: sum.statShots + current.shots,
			statShotsOT: sum.statShotsOT + current.shotsOnTarget,
			statSaves: sum.statSaves + current.saves,
			statTotPass: sum.statTotPass + current.totalPasses,
			statAccPass: sum.statAccPass + current.accuratePasses,
			statKeyPass: sum.statKeyPass + current.keyPasses,
			statBlocks: sum.statBlocks + current.blocks,
			statTackles: sum.statTackles + current.tackles,
			statInterceptions: sum.statInterceptions + current.interceptions,
			statDribblesAttempted: sum.statDribblesAttempted + current.dribblesAttempted,
			statDribblesSuccess: sum.statDribblesSuccess + current.dribblesSuccess,
			statDribblesPast: sum.statDribblesPast + current.dribblesPast,
			statConceeded: sum.statConceeded + current.goalsAgainst,
			statCleanSheet: sum.statCleanSheet + (current.goalsAgainst == 0),
			total: sum.total + current.points,
		}),
			{
				statMinutesPlayed: 0,
				statMatchesPlayed: 0,
				statAssists: 0,
				statGoals: 0,
				statReds: 0,
				statYellows: 0,
				statShots: 0,
				statShotsOT: 0,
				statSaves: 0,
				statTotPass: 0,
				statAccPass: 0,
				statKeyPass: 0,
				statBlocks: 0,
				statTackles: 0,
				statInterceptions: 0,
				statDribblesAttempted: 0,
				statDribblesSuccess: 0,
				statDribblesPast: 0,
				statConceeded: 0,
				statCleanSheet: 0,
				total: 0,
			}
		);
		return {
			playerId: player.id,
			clubId: player.club.id,
			clubName: player.club.name,
			clubShort: player.club.short,
			generalInfo: {
				name: player.name,
				short: player.short,
			},
			playerValue: player.value,
			positionId: player.positionId,
			...sumStats,
			// refactor: to mapping to get correct accuracy
			statInTeam: +(player.selections.length / totalTeams),
			statCaptain: +(player.selections.filter((s: any) => s.captain == 1).length / totalTeams).toFixed(2),
			statViceCaptain: +(player.selections.filter((s: any) => s.captain == 2).length / totalTeams).toFixed(2),
			statShotsAccuracy: sumStats.statShots ? ((sumStats.statShotsOT / sumStats.statShots) || 0).toFixed(2) : null,
			statPassAccuracy: sumStats.statTotPass ? ((sumStats.statAccPass / sumStats.statTotPass) || 0).toFixed(2) : null,
			statROI: (sumStats.total / player.value).toFixed(2),
			statDribbleAccuracy: sumStats.statDribblesAttempted ? ((sumStats.statDribblesSuccess / sumStats.statDribblesAttempted) || 0).toFixed(2) : null,
		};
	}).sort((a: any, b: any) => b.total - a.total);
	rep.send(allStatsPlayers);
}

export const GetMatchStatisticsHandler = async (req: any, rep: any) => {
	const stats = await prisma.statistic.findMany({
		cacheStrategy: {
			ttl: 30,
			swr: 60,
		},
		where: {
			matchId: +req.params.matchId
		}
	});
	rep.send(stats);
}

declare type ExtendedStat = Statistic & {
	calculatedPoints?: number
}

export const PutMatchStatisticHandler = async (req: any, rep: any) => {
	try {
		const match = await prisma.match.findUnique({
			where: {
				id: +req.params.matchId,
			}
		});

		if(!match?.awayId || !match.homeId) {
			throw new HttpError('Match has no home or away team assigned.',400);
		}

		const playersWithPositionIds = await prisma.player.findMany({
			select: {
				id: true,
				positionId: true,
				clubId: true,
				short: true,
			},
			where: {
				clubId: {
					in: [match!.awayId, match!.homeId]
				}
			}
		});
		const playersWithCalculatedPoints = req.body.stats.map((stat: any) => {
			const player = playersWithPositionIds.find((player: any) => player.id === stat.playerId);
			const calculatedPoints = calculatePoints(stat, player?.positionId );
			return ({
				...stat,
				clubId: player!.clubId,
				minutesPlayed: Math.min(90, stat.out) - stat.in || 0,
				calculatedPoints,
			})
		});
		const homeP = playersWithCalculatedPoints
			.filter((player: any) => player.clubId === match!.homeId)
			.map((stat: any) => ({
				...stat, 
				goalsAgainst: stat.red ? req.body.goalMinutes.away.filter((gm: number) => stat.in <= gm).length : req.body.goalMinutes.away.filter((gm: number) => stat.in <= gm && stat.out >= gm).length
			}));
		const awayP = playersWithCalculatedPoints
			.filter((player: any) => player.clubId === match!.awayId)
			.map((stat: any) => ({
				...stat, 
				goalsAgainst: stat.red ? req.body.goalMinutes.home.filter((gm: number) => stat.in <= gm).length : req.body.goalMinutes.home.filter((gm: number) => stat.in <= gm && stat.out >= gm).length
			}));
		const subselection  = [
			"starting", "in", "out", "minutesPlayed", "motm", 
			"goals", "assists", "yellow", "red",
			"penaltySaved", "saves", "highClaims",
			"shotsBlocked", "shotsOnTarget", "shotsOffTarget",
			"keyPasses", "accuratePasses", "totalPasses", "totalCrosses", "accurateCrosses", 
			"clearances", "blocks", "interceptions", "tackles",
			"dribblesAttempted", "dribblesSuccess", "dribblesPast",
			"foulsDrawn", "foulsCommited",
			"penaltyCommited", "penaltyWon", "penaltyScored", "penaltyMissed",
			"duelsTotal", "duelsWon", "aerialDuelsTotal", "aerialDuelsWon",
			"errorLeadingGoal", "bigChancesCreated", "bigChancesMissed",
			"goalsAgainst"
		]
		
		await prisma.$transaction([
			
			prisma.match.update({
				where: {
					id: +req.params.matchId
				},
				data: {
					homeScore: +req.body.score.home,
					awayScore: +req.body.score.away,
					status: ProcessState.STATS_UPDATED,
					home: {
						update: {
							players: {
								update: homeP.map((stat: ExtendedStat) => {
									const reducedStat = pick(pickBy(stat, (v, k) => (v !== null && v !== undefined)), subselection);
									return ({
										where: {
											id: stat.playerId,
										},
										data: {
											selections: {
												updateMany: {
													where: {
														weekId: match!.weekId,
														playerId: stat.playerId,
													},
													data: {
														points: stat.calculatedPoints,
														played: +(reducedStat.minutesPlayed || 0) > 0 ? 1 : 0
													}
												}
											},
											stats: {
												upsert: {
													where: {
														matchId_playerId: {
															matchId: +req.params.matchId,
															playerId: stat.playerId,
														},
													},
													create: {
														...reducedStat,
														matchId: +req.params.matchId,
														points: stat.calculatedPoints,
													},
													update: {
														...reducedStat,
														points: stat.calculatedPoints,
													}
												}
											}
										}
									})
								})
							}
						}
					},
					away: {
						update: {
							players: {
								update: awayP.map((stat: ExtendedStat) => {
									const reducedStat = pick(pickBy(stat, (v, k) => (v !== null && v !== undefined)), subselection);
									return ({
										where: {
											id: stat.playerId,
										},
										data: {
											selections: {
												updateMany: {
													where: {
														weekId: match!.weekId,
														playerId: stat.playerId,
													},
													data: {
														points: stat.calculatedPoints,
														played: +(reducedStat.minutesPlayed || 0) > 0 ? 1 : 0
													}
												}
											},
											stats: {
												upsert: {
													where: {
														matchId_playerId: {
															matchId: +req.params.matchId,
															playerId: stat.playerId,
														},
													},
													create: {
														...reducedStat,
														matchId: +req.params.matchId,
														points: stat.calculatedPoints,
													},
													update: {
														...reducedStat,
														points: stat.calculatedPoints,
													}
												}
											}
										}
									})
								})
							}
						}
					},
				}
			}),
			// Captain - Vice Captain points multipliers (Triple Captain / Vice victory)
			prisma.$queryRaw`CALL "processViceCaptainAndBoosters"(${match.weekId})`,
			// HiddenGem - GoalRush points multipliers
			prisma.$queryRaw`CALL "processPlayerBoosters"(${match.weekId})`
		]);

		rep.send({ msg: `Statistics saved for Match with id ${match?.id}` });
	} catch (e: any) {
		console.error(e);
	}
}

export const PostMatchStatisticsHandler = async (req: any, rep: any) => {
}

export const DeleteMatchStatisticHandler = async (req: any, rep: any) => {

}
export const ImportMatchStatisticHandler = async (req: any, rep: any) => {
	const match = await prisma.match.findFirst({
		where: {
			id: +req.params.matchId
		}
	});

	const mapExternalInternalIds = await prisma.player.findMany({
		select: {
			id: true,
			externalId: true
		},
		where: {
			clubId: {
				in: [match!.awayId || 0, match!.homeId || 0]
			}
		}
	});

	const res = await axios.request({
		method: 'get',
		url: 'https://v3.football.api-sports.io/fixtures/players',
		headers: {
			'x-rapidapi-key': 'a47085f2b2fcd66e93caad6b7d7f6b09',
			'x-rapidapi-host': 'v3.football.api-sports.io'
		},
		params: {
			'fixture': match?.externalId
		}
	});


	if (res.status != 200 || !res.data || (Array.isArray(res.data.errors) && (res.data.errors.length > 0)) || Object.keys(res.data.errors).length !== 0) {
		throw new HttpError(Object.values(res.data.errors).reduce((s, v) => `${s}${v} `, '') as string, 429)
	}
	if(res.data.response?.length === 0) {
		throw new HttpError("No stats yet",404);
	}
	const converted = res.data.response.map((resp: any) => {
		return resp.players.map((player: any) => {
			const stats = player.statistics[0];

			return ({
				id: mapExternalInternalIds.find((p: any) => p.externalId == player.player.id)?.id,
				minutesPlayed: +stats.games.minutes || 0,
				starting: !(!!stats.games.substitute),
				shots: +stats.shots.total || 0,
				shotsOnTarget: +stats.shots.on || 0,
				goals: +stats.goals.total || 0,
				assists: +stats.goals.assists || 0,
				saves: +stats.goals.saves || 0,
				keyPasses: +stats.passes.key || 0,
				totalPasses: +stats.passes.total || 0,
				accuratePasses: +stats.passes.accuracy || 0,
				tackles: +stats.tackles.total || 0,
				blocks: +stats.tackles.blocks || 0,
				interceptions: +stats.tackles.interceptions || 0,
				dribblesAttempted: +stats.dribbles.attempts || 0,
				dribblesSuccess: +stats.dribbles.success || 0,
				dribblesPast: +stats.dribbles.past || 0,
				foulsDrawn: +stats.fouls.drawn || 0,
				foulsCommited: +stats.fouls.commited || 0,
				penaltyScored: +stats.penalty.scored || 0,
				penaltyCommited: +stats.penalty.commited || 0,
				penaltyMissed: +stats.penalty.missed || 0,
				penaltyWon: +stats.penalty.won || 0,
				penaltySaved: +stats.penalty.saved || 0,
				duelsWon: +stats.duels.won || 0,
				duelsTotal: +stats.duels.total || 0,
				yellow: !!stats.cards.yellow || false,
				red: !!stats.cards.red || false,
				motm: false,
			})
		});
	});

	const convertedToSingleTeam = converted[0].concat(converted[1]);

	const matchUpdate = await prisma.match.update({
		where: {
			id: +req.params.matchId,
		},
		data: {
			status: ProcessState.STATS_IMPORTED,
		}
	});

	rep.send(convertedToSingleTeam);
}