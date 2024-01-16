import { prisma } from "../db/client";

export const GetProfileHandler = async (req: any, rep: any) => {
		const user = await prisma.user.findUnique({
				where: {
						id: req.user.id
				},
				cacheStrategy: { ttl: 60 },
		})
		rep.send(user);
}

export const PutUserHandler = async(req: any, rep: any) => {
		const user = await prisma.user.update({
				where: {
						id: req.user.id
				},
				data: {

				}
		})
}

export const GetTeamsHandler = async (req: any, rep: any) => {
		const user = await prisma.user.findUnique({
				where: {
						id: req.user.id
				},
				select: {
						id: true,
						firstName: true,
						lastName: true,
				},
				cacheStrategy: { ttl: 60 },
		});
		const teams = await prisma.team.findMany({
				where: {
						user: {
								id: req.user.id
						}
				},
				cacheStrategy: { ttl: 60 },
		})
		rep.send({teams, user});		
}