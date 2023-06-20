import { prisma } from "@/db/client"
import HttpError from "@/utils/HttpError";
import axios from "axios";

export const GetClubsHandler = async (req: any, rep: any) => {
    const clubs = await prisma.club.findMany({});
    rep.send(clubs);
}

export const GetClubHandler = async (req: any, rep: any) => {

}

export const PutClubHandler = async (req: any, rep: any) => {
    const club = await prisma.club.update({
        where: {
            id: +req.params.id
        },
        data: {
            ...req.body
        }
    });
    rep.send(club);
}

export const PostClubHandler = async (req: any, rep: any) => {
    const club = await prisma.club.create({
        data: req.body
    });
    rep.send(club);

}

export const DeleteClubHandler = async (req: any, rep: any) => {

}

export const ImportClubsHandler = async (req: any, rep: any) => {
    // should import images too: https://media.api-sports.io/football/teams/{team_id}.png
    const res = await axios.request({
        method: 'get',
        url: 'https://v3.football.api-sports.io/teams',
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

    const respToData = res.data.response.map((externalClub: any) => ({
        externalId: externalClub.team.id,
        name: externalClub.team.name,
        short: externalClub.team.code,
    }))

    try {
        const createdClubs = await prisma.club.createMany({
            data: respToData,
        })
        rep.send(createdClubs)
    } catch (err: any) {
        throw new Error("Prisma error "+ err.code);
    }
}