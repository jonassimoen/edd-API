import { prisma } from "../db/client";
import {SimpleIntervalJob, AsyncTask } from "toad-scheduler"

const percentageSelectionsTask = new AsyncTask(
    'Update percentage of selections of players',
    () => { 
		return prisma.$queryRaw`call "calculatePercentageSelections"()`;
	},
    (err: any) => { 
		console.error("UPDATING PLAYER SELECTIONS WENT WRONG!")
		prisma.audit.create({
			data: {
				action: "UPDATE_PSELECTION",
				params: "WENT WRONG",
				timestamp: new Date(),
				user: {
					connect: {
						id: 1,
					}
				},
			}
		});
	}
);

export const percentageSelectionsJob = new SimpleIntervalJob({ hours: 1, }, percentageSelectionsTask)