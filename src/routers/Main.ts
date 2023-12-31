import { UserRouter } from './User';
import { FastifyPluginAsync } from "fastify";
import { TeamRouter } from "./Team";
import { AdminPlayerRouter, PublicPlayerRouter } from './Player';
import { AdminClubRouter, PublicClubRouter } from './Club';
import { requireAdmin } from '../middleware//RequireAdmin';
import { AdminMatchRouter, PublicMatchRouter } from './Match';
import { AdminMatchEventRouter, PublicMatchEventRouter } from './MatchEvent';
import { AdminMatchStatisticRouter, PublicMatchStatisticRouter, PublicPlayerStatisticRouter } from './Statistic';
import { AdminWeekRouter, PublicWeekRouter } from './Week';
import { PublicPageRouter } from './Page';

export const PublicRouter: FastifyPluginAsync = async server => {
		server.register(UserRouter, { prefix: '/user' });
		server.register(TeamRouter, { prefix: '/teams' });
		server.register(PublicPlayerRouter, { prefix: '/players' })
		server.register(PublicClubRouter, { prefix: '/clubs' })
		server.register(PublicMatchRouter, { prefix: '/matches' })
		server.register(PublicMatchEventRouter, { prefix: '/matches/:matchId/events' })
		server.register(PublicMatchStatisticRouter, { prefix: '/matches/:matchId/stats' })
		server.register(PublicWeekRouter, { prefix: '/weeks' })
		server.register(PublicPlayerStatisticRouter, { prefix: '/player-stats' })
		server.register(PublicPageRouter, {prefix: '/pages'})
}

export const AdminRouter: FastifyPluginAsync = async server => {
		server.addHook("preHandler", requireAdmin)
		server.register(AdminPlayerRouter, { prefix: '/players' })
		server.register(AdminClubRouter, { prefix: '/clubs' })
		server.register(AdminMatchRouter, { prefix: '/matches' })
		server.register(AdminMatchEventRouter, { prefix: '/matches/:matchId/events' })
		server.register(AdminMatchStatisticRouter, { prefix: '/matches/:matchId/stats' })
		server.register(AdminWeekRouter, { prefix: '/weeks' })
}