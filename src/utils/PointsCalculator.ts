declare type Statistic = {
		minutesPlayed: number,
		goals: number,
		assists: number,
		shots: number,
		shotsOnTarget: number,
		saves: number,
		keyPasses: number,
		passAccuracy: number,
		tackles: number,
		blocks: number,
		interceptions: number,
		dribblesAttempted: number,
		dribblesSuccess: number,
		dribblesPast: number,
		foulsDrawn: number,
		foulsCommited: number,
		penaltySaved: number,
		penaltyCommited: number,
		penaltyWon: number,
		penaltyScored: number,
		penaltyMissed: number,
		duelsWon: number,
		duelsTotal: number,
		red: boolean,
		yellow: boolean,
		motm: boolean,
}

enum PPS {
		PLAYED_MORE_THAN_60_MIN = 2,
		PLAYED_LESS_THAN_60_MIN = 1,
		GOAL_GK = 7,
		GOAL_DEF = 6,
		GOAL_MID = 5,
		GOAL_ATT = 4,
		ASSIST = 2,
		PENALTY_SAVE = 5,
		PENALTY_MISS = -2,
		MOTM = 5,
		YELLOW = -1,
		RED = -3,
		OWN_GOAL = -2,
		CONCEDED_2_GK = -2,
		CONCEDED_2_DEF = -1,
		SAVES_PER_2 = 1,
		CS_GK = 4,
		CS_DEF = 4,
		CS_MID = 1,

		// PASS_ACCURACY_MORE_65 = 0,
		// KEY_PASSES_PER_2 = 0,
		// DRIBBLES_SUCCESS_MORE_PER_5 = 0,
		// DUELS_WON_MORE_75 = 0,
		// FOULS_COMMITED_PER_3 = 0,
		// INTERCEPTIONS_PER_7 = 0,


}

export const calculatePoints = (playerStat: Statistic, position: number): number => {
		let tempPoints = 0;
		tempPoints += playerStat.minutesPlayed > 60 ? PPS.PLAYED_MORE_THAN_60_MIN : (playerStat.minutesPlayed > 0) ? PPS.PLAYED_LESS_THAN_60_MIN : 0;
		tempPoints += playerStat.assists * PPS.ASSIST;
		tempPoints += playerStat.penaltyMissed * PPS.PENALTY_MISS;

		switch (position) {
				case 1:
						tempPoints += calculatePointsGK(playerStat);
						break;
				case 2:
						tempPoints += calculatePointsDEF(playerStat);
						break;
				case 3:
						tempPoints += calculatePointsMID(playerStat);
						break;
				case 4:
						tempPoints += calculatePointsATT(playerStat);
						break;
		}
		return +tempPoints || 0;
}

const calculatePointsGK = (playerStat: Statistic): number => {
		let tempPoints = 0;

		tempPoints += Math.floor(playerStat.saves / 2) * PPS.SAVES_PER_2;
		tempPoints += playerStat.goals * PPS.GOAL_GK;

		return tempPoints;
}

const calculatePointsDEF = (playerStat: Statistic): number => {
		let tempPoints = 0;

		tempPoints += playerStat.goals * PPS.GOAL_DEF;

		return tempPoints;
}

const calculatePointsMID = (playerStat: Statistic): number => {
		let tempPoints = 0;

		tempPoints += playerStat.goals * PPS.GOAL_MID;

		return tempPoints;
}

const calculatePointsATT = (playerStat: Statistic): number => {
		let tempPoints = 0;

		tempPoints += playerStat.goals * PPS.GOAL_ATT;

		return tempPoints;
}
