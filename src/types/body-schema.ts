import { MatchEventType } from "@prisma/client";

export const AddTeamSchema = {
    body: {
        type: 'object',
        properties: {
            starting: {
                type: 'array',
                items: { type: 'number' }
            },
            bench: {
                type: 'array',
                items: { type: 'number' }
            },
            captainId: { type: 'number' },
            viceCaptainId: { type: 'number' },
            teamName: { type: 'string' }
        }

    }
}

export const TransfersTeamSchema = {
    body: {
        type: 'object',
        properties: {
            transfers: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        inId: { type: 'number' },
                        outId: { type: 'number' }
                    }
                }
            }
        }
    }
}

export const ClubPostSchema = {
    type: 'object',
    properties: {
        externalId: { type: 'number' },
        name: { type: 'string' },
        short: { type: 'string' },
    }
};

export const ClubPutSchema = {
    type: 'object',
    properties: {
        externalId: { type: 'number' },
        name: { type: 'string' },
        short: { type: 'string' },
    }
};

export const PlayerPostSchema = {
    type: 'object',
    properties: {
        banned: { type: 'number' },
        captain: { type: 'number' },
        clubId: { type: 'number' },
        externalId: { type: 'number' },
        forename: { type: 'string' },
        form: { type: 'number' },
        injury: { type: 'number' },
        portraidUrl: { type: 'string' },
        positionId: { type: 'number' },
        setPieces: { type: 'number' },
        short: { type: 'string' },
        star: { type: 'number' },
        surname: { type: 'string' },
        value: { type: 'number' },
    }
};

export const PlayerPutSchema = PlayerPostSchema;

export const MatchPostSchema = {
    type: 'object',
    properties: {
        homeId: { type: 'number' },
        awayId: { type: 'number' },
        weekId: { type: 'number' },
        date: { type: 'string' },
    }
};

export const MatchPutSchema = {
    type: 'object',
    properties: {
        postponed: { type: 'number' },
        date: { type: 'string' },
        homeScore: { type: 'number' },
        awayScore: { type: 'number' },
    }
}

export const MatchEventPostSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            type: { type: 'string' },
            matchId: { type: 'number' },
            playerId: { type: 'number' },
            minute: { type: 'number' },
        }
    }
};

export const MatchEventPutSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            type: { type: 'string' },
            matchId: { type: 'number' },
            playerId: { type: 'number' },
            minute: { type: 'number' },
        }
    }
};

export const MatchStartingPostSchema = {
    type: 'array',
    items: { type: 'number' }
}


export const MatchStatisticPutSchema = {
    type: "object",
    properties: {
        stats: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    playerId: { type: 'number' },
                    minutesPlayed: { type: 'number' },
                    goals: { type: 'number' },
                    assists: { type: 'number' },
                    shots: { type: 'number' },
                    shotsOnTarget: { type: 'number' },
                    saves: { type: 'number' },
                    keyPasses: { type: 'number' },
                    passAccuracy: { type: 'number' },
                    tackles: { type: 'number' },
                    blocks: { type: 'number' },
                    interceptions: { type: 'number' },
                    dribblesAttempted: { type: 'number' },
                    dribblesSuccess: { type: 'number' },
                    dribblesPast: { type: 'number' },
                    foulsDrawn: { type: 'number' },
                    foulsCommited: { type: 'number' },
                    penaltySaved: { type: 'number' },
                    penaltyCommited: { type: 'number' },
                    penaltyWon: { type: 'number' },
                    penaltyScored: { type: 'number' },
                    penaltyMissed: { type: 'number' },
                    duelsWon: { type: 'number' },
                    duelsTotal: { type: 'number' },
                    red: { type: 'boolean' },
                    yellow: { type: 'boolean' },
                    motm: { type: 'boolean' },
                }
            }
        },
        matchId: { type: 'number' },
        score: {
            type: 'object',
            properties: {
                home: { type: 'number' },
                away: { type: 'number' }
            }
        }
    }
};

export const MatchStatisticPostSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            type: { type: 'string' },
            matchId: { type: 'number' },
            playerId: { type: 'number' },
            minute: { type: 'number' },
        }
    }
};

export const WeekPostSchema = {
    type: 'object',
    properties: {
        id: { type: 'number' },
        deadlineDate: { type: 'string' },
    }
};

export const WeekPutSchema = {
    type: 'object',
    properties: {
        deadlineDate: { type: 'string' },
    }
};