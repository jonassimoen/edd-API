import { prisma } from "@db/client"
import HttpError from "@utils/HttpError";
import axios from "axios";

export const GetMatchesHandler = async (req: any, rep: any) => {
    const matches = await prisma.match.findMany({
        include: {
            home: true,
            away: true
        },
        orderBy: {
            date: 'asc'
        }
    });
    rep.send(matches);
}

export const GetMatchHandler = async (req: any, rep: any) => {
    const match = await prisma.match.findUnique({
        where: {
            id: +req.params.id
        },
        select: {
            id: true,
            home: true,
            away: true,
            weekId: true,
            date: true,
            postponed: true,
            homeScore: true,
            awayScore: true,
        }
    });
    rep.send(match);
}

export const PutMatchHandler = async (req: any, rep: any) => {
    const match = await prisma.match.update({
        where: {
            id: +req.params.id
        },
        data: req.body
    });
    rep.send(match);
}

export const PostMatchHandler = async (req: any, rep: any) => {
    const { homeId, awayId, weekId, ...rest } = req.body;
    const match = await prisma.match.create({
        data: {
            ...rest,
            home: {
                connect: {
                    id: homeId
                }
            },
            away: {
                connect: {
                    id: awayId
                }
            },
            week: {
                connect: {
                    id: weekId
                }
            },
        }
    });
    rep.send(match);
}

export const DeleteMatchHandler = async (req: any, rep: any) => {

}

export const ImportMatchesHandler = async (req: any, rep: any) => {
    const res = await axios.request({
        method: 'get',
        url: 'https://v3.football.api-sports.io/fixtures',
        headers: {
            'x-rapidapi-key': 'a47085f2b2fcd66e93caad6b7d7f6b09',
            'x-rapidapi-host': 'v3.football.api-sports.io'
        },
        params: {
            'league': 1,
            'season': 2022,
        }
    });
 
    if (res.status != 200 || !res.data || (Array.isArray(res.data.errors) && (res.data.errors.length > 0)) || Object.keys(res.data.errors).length !== 0) {
        throw new HttpError(Object.values(res.data.errors).reduce((s, v) => `${s}${v} `, '') as string, 429)
    }

    const clubs = (await prisma.club.findMany()).map((club: any) => ({
        id: club.id,
        external: club.externalId,
    }));

    const respToData = res.data.response.map((externalClub: any) =>( {
        externalId: externalClub.fixture.id,
        date: new Date(externalClub.fixture.date),
        // homeId: externalClub.teams.home.id,
        homeId: clubs.find((c: any) => c.external === externalClub.teams.home.id)?.id,
        awayId: clubs.find((c: any) => c.external === externalClub.teams.away.id)?.id,
    }));


    try {
        const createdGames = await prisma.match.createMany({
            data: respToData,
        })
        rep.send(createdGames)
    } catch (err: any) {
        throw new Error("Prisma error "+ err);
    }
}