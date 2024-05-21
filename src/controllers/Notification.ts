import { getMessaging } from "firebase-admin/messaging";
import { app } from "../../api/index"
import { prisma } from "../db/client";

export const RegisterTokenHandler = async(req: any, rep: any) => {
	getMessaging(app).subscribeToTopic(req.body.token, `edd-app-${process.env.ENV}`);
	const token = await prisma.notificationToken.create({
		data: {
			token: req.body.token,
			user: {
				connect: {
					id: +req.user.id
				}
			},
			timestamp: new Date().toISOString(),
		}
	})
	rep.status(200);
}

export const PushNotificationHandler = async(req: any, rep: any) => {
	
	const id = await getMessaging(app).send({
		topic: `edd-app-${process.env.ENV}`,
		webpush: {
			notification: {
				title: req.body.title || "",
				body: req.body.body || "",
				badge: req.body.photo || "",
				icon: req.body.photo || "",
			},
			fcmOptions: {
				link: req.body.link || "",
			}
		}
	})
	rep.send(id);
}