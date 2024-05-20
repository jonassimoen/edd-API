import { UserRouter } from './User';
import { FastifyPluginAsync } from "fastify";
import { TeamRouter } from "./Team";
import { AdminPlayerRouter, PublicPlayerRouter } from './Player';
import { AdminClubRouter, PublicClubRouter } from './Club';
import { RequireAdmin } from '../middleware//RequireAdmin';
import { AdminMatchRouter, PublicMatchRouter } from './Match';
import { AdminMatchStatisticRouter, PublicMatchStatisticRouter, PublicPlayerStatisticRouter } from './Statistic';
import { AdminWeekRouter, PublicWeekRouter } from './Week';
import { AdminPageRouter, PublicPageRouter } from './Page';
import { AdminGeneralRouter } from './Admin';
import { NotificationRouter } from './Notification';
import { AdminNewsRouter, PublicNewsRouter } from './News';

export const PublicRouter: FastifyPluginAsync = async server => {
	server.register(NotificationRouter, { prefix: '/notifications' })
	server.register(UserRouter, { prefix: '/user' });
	server.register(TeamRouter, { prefix: '/teams' });
	server.register(PublicPlayerRouter, { prefix: '/players' })
	server.register(PublicClubRouter, { prefix: '/clubs' })
	server.register(PublicMatchRouter, { prefix: '/matches' })
	server.register(PublicMatchStatisticRouter, { prefix: '/matches/:matchId/stats' })
	server.register(PublicWeekRouter, { prefix: '/weeks' })
	server.register(PublicPlayerStatisticRouter, { prefix: '/player-stats' })
	server.register(PublicPageRouter, {prefix: '/pages'})
	server.register(PublicNewsRouter, {prefix: '/news'})
}

export const AdminRouter: FastifyPluginAsync = async server => {
	server.addHook("preHandler", RequireAdmin)
	server.register(AdminGeneralRouter, { prefix: '/general' })
	server.register(AdminPlayerRouter, { prefix: '/players' })
	server.register(AdminClubRouter, { prefix: '/clubs' })
	server.register(AdminMatchRouter, { prefix: '/matches' })
	server.register(AdminMatchStatisticRouter, { prefix: '/matches/:matchId/stats' })
	server.register(AdminWeekRouter, { prefix: '/weeks' })
	server.register(AdminPageRouter, { prefix: '/pages' })
	server.register(AdminNewsRouter, {prefix: '/news'})
}