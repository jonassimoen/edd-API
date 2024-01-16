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
	goalsAgainst: number,
	red: boolean,
	yellow: boolean,
	motm: boolean,
}

const PPS = {
	PLAYED_MORE_THAN_60_MIN: [0, 2, 2, 2, 2],
	PLAYED_LESS_THAN_60_MIN: [0, 1, 1, 1, 1],
	GOAL: [0, 7, 6, 5, 4],
	ASSIST: [0, 3, 3, 3, 3],
	PENALTY_SAVE: [0, 5, 15, 15, 15],
	PENALTY_MISS: [0, -5, -2, -2, -2],
	MOTM: [0, 5, 5, 5, 5],
	YELLOW: [0, -1, -1, -1, -1],
	RED: [0, -3, -3, -3, -3],
	OWN_GOAL: [0, -2, -2, -2, -2],
	CONCEDED_2: [0, -2, -1, 0, 0],
	SAVES_PER_2: [0, 1, 0, 0, 0],
	CLEAN_SHEET: [0, 4, 4, 1, 0],

	// PASS_ACCURACY_MORE_65 = 0,
	// KEY_PASSES_PER_2 = 0,
	// DRIBBLES_SUCCESS_MORE_PER_5 = 0,
	// DUELS_WON_MORE_75 = 0,
	// FOULS_COMMITED_PER_3 = 0,
	// INTERCEPTIONS_PER_7 = 0,


}

export const calculatePoints = (playerStat: Statistic, positionId: number): number => {
	let tempPoints = 0;

	tempPoints += playerStat.minutesPlayed > 60 ? PPS.PLAYED_MORE_THAN_60_MIN[positionId] : (playerStat.minutesPlayed > 0) ? PPS.PLAYED_LESS_THAN_60_MIN[positionId] : 0;
	tempPoints += (playerStat.goals || 0) * PPS.GOAL[positionId];
	tempPoints += (playerStat.assists || 0) * PPS.ASSIST[positionId];
	tempPoints += (playerStat.penaltyMissed || 0) * PPS.PENALTY_MISS[positionId];
	tempPoints += (playerStat.penaltySaved || 0) * PPS.PENALTY_SAVE[positionId];
	tempPoints += playerStat.motm ? PPS.MOTM[positionId] : 0;
	tempPoints += playerStat.yellow ? PPS.YELLOW[positionId] : 0;
	tempPoints += playerStat.red ? PPS.RED[positionId] : 0;
	tempPoints += (Math.floor(playerStat.saves / 2) || 0) * PPS.SAVES_PER_2[positionId];
	// tempPoints += playerStat.ownGoal * PPS.OWN_GOAL[positionId];
	// tempPoints += Math.floor(playerStat.goalsAgainst / 2) * PPS.CONCEDED_2[positionId];
	// tempPoints += playerStat.goalsAgainst === 0 ? PPS.CLEAN_SHEET[positionId] : 0;

	return tempPoints;
}