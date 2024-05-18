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