import HttpError from "../utils/HttpError";
import { prisma } from "../db/client";
import qs from "qs";

export const LogoutHandler = async (req: any, rep: any) => {
	rep.status(200).clearCookie('token').clearCookie('refreshToken').clearCookie('accessToken')
}

export const GetProfileHandler = async (req: any, rep: any) => {
		const user = await prisma.user.findUnique({
				cacheStrategy: {
					ttl: 30,
					swr: 60,
				},
				where: {
						id: req.user.id
				}
		})
		rep.send(user);
}

export const PaymentIntentHandler = async (req: any, rep: any) => {
	const { stripe } = req.server;

	const stripeCustomer =  await stripe.customers.search({
		query: `email:\"${req.user.email}\"`,
	});
	
	await stripe.paymentIntents.create({
		amount: 500,
		currency: "eur",
		automatic_payment_methods: {
			enabled: true,
		},
		customer: stripeCustomer.data[0]?.id,
	}).then(
		(paymentIntent: any) => rep.send({clientSecret: paymentIntent.client_secret})
	).catch(
		(err: any) => rep.status(501).send("Something went wrong with the payment intent!")
	);
}

export const PaymentResultHandler = async (req: any, rep: any) => {
	if(!req.query.payment_intent) {
		new HttpError("No payment found",404);
	}
	const { stripe } = req.server;
	await stripe.paymentIntents.retrieve(req.query.payment_intent)
		.then((paymentIntent: any) => {
			if(paymentIntent.status === "succeeded") {
				return prisma.user.update({
					where: {
						id: req.user.id
					},
					data: {
						payed: true,
					}
				})
			} 
		})
		.then(() => rep.redirect(`${process.env.WEBAPP_URL}/payment/result?${qs.stringify({ payment: req.query.payment_intent_client_secret })}`))
		.catch(
			(err: any) => rep.status(501).send("Something went wrong with the payment intent!")
		);
}

export const GetTeamsHandler = async (req: any, rep: any) => {
		const user = await prisma.user.findUnique({
				cacheStrategy: {
					ttl: 30,
					swr: 60,
				},
				where: {
						id: req.user.id
				},
				select: {
						id: true,
						firstName: true,
						lastName: true,
				}
		});
		const teams = await prisma.team.findMany({
				cacheStrategy: {
					ttl: 30,
					swr: 60,
				},
				where: {
						user: {
								id: req.user.id
						}
				}
		})
		rep.send({teams, user});
}