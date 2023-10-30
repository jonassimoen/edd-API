import { prisma } from "@/db/client"

export const upcomingWeekId = async () => {
    const week = await prisma.week.findFirst({
        where: {
            deadlineDate: {
                gte: new Date()
            }
        },
        orderBy: {
            deadlineDate: 'asc',
        }
    });
    return (week && week.id) || 0;
}