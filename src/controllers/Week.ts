import { prisma } from "@/db/client"

export const GetWeeksHandler = async (req: any, rep: any) => {
    const weeks = await prisma.week.findMany({
        orderBy: {
            id: 'asc'
        }
    });
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
export const GetDeadlineInfoHandler = async (req: any, rep: any) => {
    const weeks = await prisma.week.findMany({
        orderBy: {
            id: 'asc'
        }
    });
    const deadlineWeek = await prisma.week.findFirst({
        where: {
            deadlineDate: {
                gte: new Date()
            }
        },
        orderBy: {
            deadlineDate: 'asc',
        }
    })
    rep.send({
        deadlineInfo: {
            deadlineDate: deadlineWeek?.deadlineDate,
            deadlineWeek: deadlineWeek?.id,
            displayWeek: (deadlineWeek?.id || 0) + 1,
            endWeek: weeks[weeks.length - 1].id,
        },
        weeks
    });
}