import { prisma } from "@db/client"

export const GetMatchEventsHandler = async (req: any, rep: any) => {
    const events = await prisma.matchEvent.findMany({
        where: {
            matchId: +req.params.matchId
        },
        orderBy: {
            type: 'asc'
        },
        include: {
            player: true
        }
    });
    rep.send(events);
}

// export const GetMatchEventHandler = async (req: any, rep: any) => {
//     const event = await prisma.matchEvent.findUnique({
//         where: {
//             id: req.params.id
//         }
//     });
//     rep.send(event);
// }

export const PutMatchEventHandler = async (req: any, rep: any) => {
    const events = await prisma.matchEvent.deleteMany({
        where: {
            matchId: +req.params.matchId
        }
    });
    const event = await prisma.matchEvent.createMany({
        data: {
            ...req.body
        }
    });
    rep.send(event);
}

export const PostMatchEventsHandler = async (req: any, rep: any) => {
    const eventsData = req.body.map((ev: any) => {
        return {
            type: ev.type,
            matchId: ev.matchId,
            playerId: ev.playerId,
            minute: ev.minute,
        }
    })
    const event = await prisma.matchEvent.createMany({
        data: eventsData,
    });
    rep.send(event);
}
export const PostMatchStartingHandler = async (req: any, rep: any) => {
    const events = await prisma.matchEvent.deleteMany({
        where: {
            matchId: +req.params.matchId,
            type: 'Starting'
        }
    });
    const startingData = req.body.map((id: any) => {
        return {
            type: 'Starting',
            matchId: +req.params.matchId,
            playerId: id,
            minute: 0,
        }
    })
    const starting = await prisma.matchEvent.createMany({
        data: startingData,
    });
    rep.send(starting);
}

export const DeleteMatchEventHandler = async (req: any, rep: any) => {

}