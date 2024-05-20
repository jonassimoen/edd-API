import { prisma } from "../db/client"

export const GetArticlesHandler = async (req: any, rep: any) => {
	const page = +req.query.page || 1;
	const [articleCount, articles] = await Promise.all([
		await prisma.article.count(),
		await prisma.article.findMany({
			select: {
				id: true,
				slug: true,
				title: true,
				description: true,
				timestampCreated: true,
				timestampUpdated: true,
				readMore: true,
				imageUrl: true,
				author: {
					select: {
						firstName: true,
					}
				}
			},
			orderBy: {
				timestampCreated: 'desc'
			},
			take: 5,
			skip: (page - 1) * 5
		}),
	])
	rep.send({
		articles,
		count: articleCount,
	})
}

export const GetArticleHandler = async (req: any, rep: any) => {
	const articles = await prisma.article.findFirst({
		select: {
			id: true,
			slug: true,
			title: true,
			description: true,
			timestampCreated: true,
			timestampUpdated: true,
			imageUrl: true,
			readMore: true,
			author: {
				select: {
					firstName: true,
				}
			}
		},
		where: {
			slug: req.params.slug
		}
	});
	rep.send(articles)
}

export const PutArticleHandler = async (req: any, rep: any) => {
	const articles = await prisma.article.update({
		where: {
			id: +req.params.id
		},
		data: {
			slug: req.body.slug,
			title: req.body.title,
			description: req.body.description,
			imageUrl: req.body.imageUrl,
			readMore: req.body.readMore,
			timestampUpdated: new Date(),
		}
	});
	rep.send(articles)
}

export const PostArticleHandler = async (req: any, rep: any) => {
	const articles = await prisma.article.create({
		data: {
			slug: req.body.slug,
			title: req.body.title,
			description: req.body.description,
			imageUrl: req.body.imageUrl,
			readMore: req.body.readMore,
			timestampCreated: new Date(),
			author: {
				connect: {
					id: +req.user.id || 0
				}
			},
		}
	});
	rep.send(articles)
}