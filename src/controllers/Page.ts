import { prisma } from "../db/client";

export const GetPagesHandler = async (req: any, rep: any) => {
	const pages = await prisma.page.findMany({
		where: {
			slug: {
				contains: req.query.slug
			}
		},
		include: {
			translation: true
		},
		orderBy: {
			id: 'asc'
		}
	});

	rep.send(pages);
};
export const GetPageHandler = async (req: any, rep: any) => {
	const pages = await prisma.page.findMany({
		where: {
			slug: {
				contains: req.query.slug
			}
		},
		include: {
			translation: true
		},
		orderBy: {
			id: 'asc'
		}
	});

	rep.send(pages);
};

export const PostPageHandler = async (req: any, rep: any) => {
	const pages = await prisma.page.create({
		data: {
			slug: req.body.slug,
			translation: {
				create: req.body.translation,
			}
		},
	});

	rep.send({ msg: 'Pagina gemaakt.' });
};

export const PutPageHandler = async (req: any, rep: any) => {
	const pages = await prisma.page.update({
		where: {
			id: +req.params.id,
		},
		data: {
			slug: req.body.slug,
			translation: {
				upsert: req.body.translation.map((tl: any) => ({
					where: {
						pageId_langCode: {
							pageId: +req.params.id,
							langCode: tl.langCode,
						}
					},
					update: {
						langCode: tl.langCode,
						body: tl.body,
					},
					create: {
						langCode: tl.langCode,
						body: tl.body,
					}
				})),
			}
		}
	});

	rep.send({ msg: 'Pagina gewijzigd.' })
};

export const DeletePageHandler = async (req: any, rep: any) => {
	const pages = await prisma.page.delete({
		where: {
			id: +req.params.id
		}
	});
	
	rep.send({ msg: 'Pagina verwijderd' });
};