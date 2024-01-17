declare type Statistic = {
	id: number
	playerId: number
	matchId: number
	teamPoints: number
	points: number
	minutesPlayed: number
	goals: number
	assists: number
	shots: number
	shotsOnTarget: number
	saves: number
	keyPasses: number
	accuratePasses: number
	totalPasses: number
	tackles: number
	blocks: number
	interceptions: number
	dribblesAttempted: number
	dribblesSuccess: number
	dribblesPast: number
	foulsDrawn: number
	foulsCommited: number
	penaltySaved: number
	penaltyCommited: number
	penaltyWon: number
	penaltyScored: number
	penaltyMissed: number
	duelsWon: number
	duelsTotal: number
	goalsAgainst: number
	red: boolean
	yellow: boolean
	motm: boolean
	starting: boolean
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
	PASS_ACCURACY_MORE_85: [0, 2, 3, 4, 3],
	KEY_PASSES_PER_2: [0, 5, 3, 3, 3],
	DRIBBLES_SUCCESS_PER_5: [0, 5, 3, 3, 3],
	DUELS_WON_MORE: [0, 1, 1, 1, 1],
	FOULS_COMMITED_PER_3: [0, -2, -2, -2, -2],
	INTERCEPTIONS_PER_7: [0, 2, 2, 2, 2],
}

export const calculatePoints = (playerStat: Statistic, goalsOpponent: number, positionId: number): number => {
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
	tempPoints += (Math.floor(goalsOpponent / 2) || 0) * PPS.CONCEDED_2[positionId];
	tempPoints += (goalsOpponent || 0 ) === 0 ? PPS.CLEAN_SHEET[positionId] : 0;
	tempPoints += playerStat.totalPasses !== 0 && (playerStat.accuratePasses / playerStat.totalPasses > 0.85) ? PPS.PASS_ACCURACY_MORE_85[positionId] : 0;
	tempPoints += (Math.floor(playerStat.keyPasses / 2) || 0) * PPS.KEY_PASSES_PER_2[positionId];
	tempPoints += (Math.floor(playerStat.dribblesSuccess / 5) || 0) * PPS.DRIBBLES_SUCCESS_PER_5[positionId];
	tempPoints += (playerStat.duelsWon > playerStat.duelsTotal - playerStat.duelsWon) ? PPS.PASS_ACCURACY_MORE_85[positionId] : 0;
	tempPoints += (Math.floor(playerStat.foulsCommited / 3) || 0) * PPS.FOULS_COMMITED_PER_3[positionId];
	tempPoints += (Math.floor(playerStat.interceptions / 7) || 0) * PPS.INTERCEPTIONS_PER_7[positionId];

	return tempPoints;
}