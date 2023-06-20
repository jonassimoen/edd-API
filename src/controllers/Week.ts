import { prisma } from "@/db/client"

export const GetWeeksHandler = async (req: any, rep: any) => {
    const weeks = await prisma.week.findMany({});
    rep.send(weeks);
}

export const GetWeekHandler = async (req: any, rep: any) => {
    const week = await prisma.week.findUnique({
        where: {
            id: +req.params.id
        }
    });
    rep.send(week);
}

export const PutWeekHandler = async (req: any, rep: any) => {
    const week = await prisma.week.update({
        where: {
            id: +req.params.id
        },
        data: {
            deadlineDate: req.body.deadlineDate
        }
    });
    rep.send(week);
}

export const PostWeeksHandler = async (req: any, rep: any) => {
    const week = await prisma.week.create({
        data: {
            id: +req.body.id,
            deadlineDate: req.body.deadlineDate
        }
    });
    rep.send(week);
}

export const DeleteWeekHandler = async (req: any, rep: any) => {

}