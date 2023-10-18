import { prisma } from "@/db/client"
import { MapPositionNameToId, fetchPlayers } from "@/utils/ExternalAPI";
import * as fs from 'fs';
import axios from "axios";
import path from "path";

export const GetPlayersHandler = async (req: any, rep: any) => {
    const players = await prisma.player.findMany({});
    rep.send(players);
}

export const GetPlayerHandler = async (req: any, rep: any) => {

}

export const PutPlayerHandler = async (req: any, rep: any) => {
    const player = await prisma.player.update({
        where: {
            id: +req.params.id
        },
        data: {
            ...req.body
        }
    });
    rep.send(player);
}

export const PostPlayerHandler = async (req: any, rep: any) => {
    const { clubId, ...body } = req.body
    const player = await prisma.player.create({
        data: {
            ...body,
            name: `${body.forename} ${body.surname}`,
            club: {
                connect: {
                    id: clubId
                }
            }
        }
    });
    rep.send(player);
}

export const DeletePlayerHandler = async (req: any, rep: any) => {

}

export const ImportPlayersHandler = async (req: any, rep: any) => {
    console.log("importing players");
    // should import images too: https://media.api-sports.io/football/teams/{team_id}.png
    
    // const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/players.json'), 'utf-8')); # dev purposes only
    const data = await fetchPlayers();

    const clubs = (await prisma.club.findMany()).map((club: any) => ({
        id: club.id,
        external: club.externalId,
    }));

    const respToData = data.map((playerObj: any) => ({
        externalId: playerObj.player.id,
        forename: playerObj.player.firstname,
        surname: playerObj.player.lastname,
        clubId: clubs.find((c: any) => c.external === playerObj.statistics[0].team.id)?.id,
        captain: playerObj.statistics[0].games.captain?1:0,
        positionId: MapPositionNameToId(playerObj.statistics[0].games.position),
        name: `${playerObj.player.firstname} ${playerObj.player.lastname}`,
        short: playerObj.player.name,
        portraitUrl: playerObj.player.portraitUrl
    }));


    try {
        const createdPlayers = await prisma.player.createMany({
            data: respToData,
        })
        rep.send(createdPlayers)
    } catch (err: any) {
        throw new Error("Prisma error "+ err);
    }
}