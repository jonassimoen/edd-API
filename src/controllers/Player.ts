import { prisma } from "../db/client"
import { fetchPlayers, fetchPlayersPerClub } from "../utils/ExternalAPI";
import * as fs from 'fs';
import axios from "axios";
import path from "path";

export const GetPlayersHandler = async (req: any, rep: any) => {
	const players = await prisma.player.findMany({
		orderBy: [
			{ value: 'desc' },
			{ clubId: 'asc' },
			{ id: 'asc' },
		],
	});
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
	const clubs = (await prisma.club.findMany()).map((club: any) => ({
		id: club.id,
		external: club.externalId,
	}));
	// const data = await fetchPlayers(req, clubs);
	const data = await fetchPlayersPerClub(req, clubs);
}