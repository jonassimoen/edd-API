import { prisma } from "@db/client"
import HttpError from "@utils/HttpError";
import axios from "axios";

export const GetPlayerStatisticsHandler = async (req: any, rep: any) => {
    const players = await prisma.player.findMany({
        include: {
            stats: {
                where: {
                    match: {
                        week: {
                            validated: true
                        }
                    }
                }
            },
            club: true
        },
    });

    const allStatsPlayers = players.map((player: any) => {
        const sumStats = player.stats.reduce((sum: any, current: any) => ({
            statAssists: sum.statAssists + current.assists,
            statGoals: sum.statGoals + current.goals,
            statReds: sum.statReds + current.reds,
            statYellows: sum.statYellows + current.yellows,
        }),
            {
                statAssists: 0,
                statGoals: 0,
                statReds: 0,
                statYellows: 0,
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
            ...sumStats
        };
    });
    rep.send(allStatsPlayers);
}

export const GetMatchStatisticsHandler = async (req: any, rep: any) => {
    const stats = await prisma.statistic.findMany({
        where: {
            matchId: +req.params.matchId
        }
    });
    rep.send(stats);
}

export const PutMatchStatisticHandler = async (req: any, rep: any) => {
    const [count, stats] = await prisma.$transaction([
        prisma.statistic.deleteMany({
            where: {
                matchId: +req.params.matchId
            }
        }),
        prisma.statistic.createMany({
            data: req.body
        })
    ])
    rep.send(stats);
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
    const converted = res.data.response.map((resp: any) => {
        return resp.players.map((player: any) => {
            const stats = player.statistics[0];

            return ({
                playerId: player.player.id,
                minutesPlayed: stats.games.minutes || 0,
                shots: stats.shots.total || 0,
                shotsOnTarget: stats.shots.on || 0,
                goals: stats.goals.total || 0,
                assists: stats.goals.assists || 0,
                saves: stats.goals.saves || 0,
                keyPasses: stats.passes.key || 0,
                passAccuracy: stats.passes.accuracy || 0,
                tackles: stats.tackles.total || 0,
                blocks: stats.tackles.blocks || 0,
                interceptions: stats.tackles.interceptions || 0,
                dribblesAttempted: stats.dribbles.attempted || 0,
                dribblesSuccess: stats.dribbles.success || 0,
                dribblesPast: stats.dribbles.past || 0,
                foulsDrawn: stats.fouls.drawn || 0,
                foulsCommited: stats.fouls.commited || 0,
                penaltyScored: stats.penalty.scored || 0,
                penaltyCommited: stats.penalty.commited || 0,
                penaltyMissed: stats.penalty.missed || 0,
                penaltyWon: stats.penalty.won || 0,
                penaltySaved: stats.penalty.saved || 0,
                duelsWon: stats.duels.won || 0,
                duelsTotal: stats.duels.total || 0,
                yellow: !!stats.cards.yellow || 0,
                red: !!stats.cards.red || 0,
            })
        });
    });

    const convertedToSingleTeam = converted[0].concat(converted[1]);

    rep.send(convertedToSingleTeam);
}