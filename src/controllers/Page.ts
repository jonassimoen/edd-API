import { prisma } from "@/db/client";

export const GetPageHandler = async (req: any, rep: any) => {
	const page = await prisma.page.findMany({
		where: {
			slug: {
				contains: req.query.slug
			}
		},
		include: {
			translation: true
		}
	});

	rep.send(page);
};

export const PostPageHandler = async (req:any, rep: any) => {

};

export const PutPageHandler = async (req:any, rep: any) => {

};

export const DeletePageHandler = async (req:any, rep: any) => {

};

export const GetPageTranslationHandler = async (req:any, rep: any) => {

};

export const PostPageTranslationHandler = async (req:any, rep: any) => {

};

export const PutPageTranslationHandler = async (req:any, rep: any) => {

};

export const DeletePageTranslationHandler = async (req:any, rep: any) => {

};