import { prisma } from "@/db/client"
import HttpError from "@/utils/HttpError";

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

    const allWithValues = allIds.map((id: number) => {
        const player = all.find((p) => p.id === id);
        return {
            playerId: id,
            value: (player ? player.value : 0),
            captain: (id === req.body.captain) ? 1 : 0,
            starting: player ? (req.body.starting.includes(player?.id) ? 1 : 0) : 0
        }
    });

    const totalValue = all.reduce((prev, curr) => ({ id: 0, value: (prev.value || 0) + (curr.value || 0) }), { id: 0, value: 0 }).value || 0;
    const budget = 100 - totalValue;

    if (budget <= 0) {
        throw new HttpError("Invalid team: invalid budget", 400);
    }

    const team = await prisma.team.create({
        data: {
            userId: req.user.id,
            selections: {
                createMany: {
                    data: allWithValues
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
    const playersWithMultipleSelections = await prisma.player.findMany({
        where: {
            selections: {
                some: {
                    teamId: +req.params.id
                }
            }
        },
        include: {
            selections: {
                take: 1
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
        }
    });
    rep.send({ team, players });
}

export const GetPointsTeamHandler = async (req: any, rep: any) => {
    const players = await prisma.player.findMany({
        include: {
            selections: true,   
        },
        where: {
            selections: {
                some: {
                    teamId: +req.params.id,
                    team: {
                        // weekId: +req.params.weekId,
                    }
                }
            }
        }

    });
    rep.send(players);
}

export const PostBoosterTeamHandler = async (req: any, rep: any) => {

}

export const PostNameTeamHandler = async (req: any, rep: any) => {
}

export const PostEditTeamHandler = async (req: any, rep: any) => {

}

export const PostSelectionsTeamHandler = async (req: any, rep: any) => {
    try {
        await prisma.$transaction(
            [].concat(
                req.body.starting.map((startingPlayerId: number) =>
                    prisma.selection.update({
                        where: {
                            playerId_teamId: {
                                playerId: startingPlayerId,
                                teamId: +req.params.id
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
                            playerId_teamId: {
                                playerId: benchPlayerId,
                                teamId: +req.params.id
                            } 
                        },
                        data: {
                            starting: 0
                        }
                    })
                ),
            )
        );
        rep.send({msg: "Ploeg is aangepast."});
    } catch(e) {
        rep.status(406);
    }
}

export const PostTransfersTeamHandler = async (req: any, rep: any) => {

}

export const PostResetTransfersTeamHandler = async (req: any, rep: any) => {

}

export const PostBadgeHandler = async (req: any, rep: any) => {

}