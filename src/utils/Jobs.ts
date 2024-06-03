import { prisma } from "../db/client";
import {SimpleIntervalJob, AsyncTask } from "toad-scheduler"

const percentageSelectionsTask = new AsyncTask(
    'Update percentage of selections of players',
    () => { 
		return prisma.$queryRaw`call "calculatePercentageSelections"()`.then(() => console.log("Update selections percentage successfully!"));
	},
    (err: any) => { 
		console.error("UPDATING PLAYER SELECTIONS WENT WRONG!", err)
	}
);

export const percentageSelectionsJob = new SimpleIntervalJob({ hours: 1, }, percentageSelectionsTask)