declare type Statistic = {
	id: number
	playerId: number
	matchId: number
	teamPoints: number
	points: number
	goalsAgainst: number

	minutesPlayed: number
	starting: boolean
	motm: boolean

	goals: number
	assists: number
	red: boolean
	yellow: boolean
	ownGoals: number

	saves: number
	highClaims: number
	penaltySaved: number

	shots: number
	shotsOnTarget: number
	shotsOffTarget: number
	shotsBlocked: number

	keyPasses: number
	accuratePasses: number
	totalPasses: number
	totalCrosses: number
	accurateCrosses: number

	clearances: number
	blocks: number
	interceptions: number
	tackles: number
	lineClearances: number

	dribblesAttempted: number
	dribblesSuccess: number
	dribblesPast: number

	foulsCommited: number
	foulsDrawn: number

	duelsWon: number
	duelsTotal: number
	aerialDuelsTotal: number
	aerialDuelsWon: number

	errorLeadingShot: number
	errorLeadingGoal: number
	bigChancesCreated: number
	bigChancesMissed: number

	penaltyCommited: number
	penaltyWon: number
	penaltyScored: number
	penaltyMissed: number
}

const PPS = {
	// General
	PLAYED_MORE_THAN_60_MIN: [0, 2, 2, 2, 2],
	PLAYED_LESS_THAN_60_MIN: [0, 1, 1, 1, 1],
	MOTM: [0, 5, 5, 5, 5],

	// Important
	GOAL: [0, 7, 6, 5, 4],
	ASSIST: [0, 3, 3, 3, 3],
	YELLOW: [0, -1, -1, -1, -1],
	RED: [0, -3, -3, -3, -3],
	OWN_GOAL: [0, -2, -2, -2, -2],

	// Goalkeeper
	SAVES_PER_2: [0, 1, 0, 0, 0],
	HIGH_CLAIMS_PER_2: [0, 1, 0, 0, 0],
	PENALTY_SAVE: [0, 5, 15, 15, 15],

	// Attacking
	SHOTS_OFF_TARGET_PER_2: [0, -1, -1, -1, -1],
	SHOTS_ON_TARGET_PER_3: [0, 1, 1, 1, 1],

	// Passing
	PASS_ACCURACY_MORE_85: [0, 2, 2, 3, 2],
	KEY_PASSES_PER_2: [0, 2, 2, 2, 2],
	ACC_CROSSES_PER_2: [0, 1, 1, 1, 1],

	// Defending
	CLEARANCES_PER_5: [0, 1, 1, 1, 1],
	BLOCKS_PER_2: [0, 1, 1, 1, 1],
	INTERCEPTIONS_PER_5: [0, 1, 1, 1, 1],
	TACKLES_PER_3: [0, 1, 1, 1, 1],
	LINE_CLEARANCE: [0, 3, 3, 3, 3],

	// Dribbles
	DRIBBLES_SUCCESS_PER_3: [0, 1, 1, 1, 1],
	DRIBBLES_PAST_PER_3: [0, -1, -1, -1, -1],

	// Fouls
	FOULS_COMMITED_PER_3: [0, -1, -1, -1, -1],
	FOULS_DRAWN_PER_3: [0, 1, 1, 1, 1],

	// Duels
	GR_DUELS_WON_MORE: [0, 1, 1, 1, 1],
	AER_DUELS_WON_MORE: [0, 1, 1, 1, 1],

	// Magic
	ERROR_SHOT: [0, -1, -1, -1, -1],
	ERROR_GOAL: [0, -3, -3, -3, -3],
	BIG_CHANCE_CREATED: [0, 2, 2, 2, 2],
	BIG_CHANCE_MISSED: [0, -2, -2, -2, -2],

	// Penalty's
	PENALTY_MISS: [0, -3, -3, -3, -3],
	PENALTY_WON: [0, 1, 1, 1, 1],
	PENALTY_COMMITED: [0, -2, -2, -2, -2],

	// Calculated
	CLEAN_SHEET: [0, 4, 4, 1, 0],
	CONCEDED_2: [0, -2, -1, 0, 0],
}

export const calculatePoints = (playerStat: Statistic, positionId: number | null | undefined): number => {
	if(positionId === null || positionId === undefined) {
		return 0
	}
	let tempPoints = 0;

	//// GENERAL
	// Minutes played
	tempPoints += playerStat.minutesPlayed > 60 ? PPS.PLAYED_MORE_THAN_60_MIN[positionId] : (playerStat.minutesPlayed > 0) ? PPS.PLAYED_LESS_THAN_60_MIN[positionId] : 0;
	// Man of the Match
	tempPoints += playerStat.motm ? PPS.MOTM[positionId] : 0;

	//// IMPORTANT
	// Goals
	tempPoints += (playerStat.goals || 0) * PPS.GOAL[positionId];
	// Assists
	tempPoints += (playerStat.assists || 0) * PPS.ASSIST[positionId];
	// Yellow card
	tempPoints += playerStat.yellow ? PPS.YELLOW[positionId] : 0;
	// Red card
	tempPoints += playerStat.red ? PPS.RED[positionId] : 0;
	// Own goals
	tempPoints += (playerStat.ownGoals || 0) * PPS.OWN_GOAL[positionId];

	//// GOALKEEPER
	// Saves (per 2)
	tempPoints += (Math.floor(playerStat.saves / 2) || 0) * PPS.SAVES_PER_2[positionId];
	// Penalty saved
	tempPoints += (playerStat.penaltySaved || 0) * PPS.PENALTY_SAVE[positionId];
	// High claims (per 2)
	tempPoints += (Math.floor(playerStat.highClaims / 2) || 0) * PPS.HIGH_CLAIMS_PER_2[positionId];
	
	//// ATTACKING
	// Shots OFF target (per 2)
	tempPoints += (Math.floor(playerStat.shotsOffTarget / 2) || 0) * PPS.SHOTS_OFF_TARGET_PER_2[positionId];
	// Shots ON target (per 3)
	tempPoints += (Math.floor(playerStat.shotsOnTarget / 3) || 0) * PPS.SHOTS_ON_TARGET_PER_3[positionId];

	//// PASSING
	// Passing accuracy above 85%
	tempPoints += playerStat.totalPasses > 10 && (playerStat.accuratePasses / playerStat.totalPasses > 0.85) ? PPS.PASS_ACCURACY_MORE_85[positionId] : 0;
	// Key passes (per 2)
	tempPoints += (Math.floor(playerStat.keyPasses / 2) || 0) * PPS.KEY_PASSES_PER_2[positionId];
	// Accurate crosses (per 2)
	tempPoints += (Math.floor(playerStat.accurateCrosses / 2) || 0) * PPS.ACC_CROSSES_PER_2[positionId];

	//// DEFENDING
	// Clearances (per 5)
	tempPoints += (Math.floor(playerStat.clearances / 5) || 0) * PPS.CLEARANCES_PER_5[positionId];
	// Blocks (per 2)
	tempPoints += (Math.floor(playerStat.clearances / 2) || 0) * PPS.BLOCKS_PER_2[positionId];
	// Interceptions (per 5)
	tempPoints += (Math.floor(playerStat.clearances / 5) || 0) * PPS.INTERCEPTIONS_PER_5[positionId];
	// Tackles (per 3)
	tempPoints += (Math.floor(playerStat.tackles / 2) || 0) * PPS.TACKLES_PER_3[positionId];
	// Line clearances
	tempPoints += (playerStat.lineClearances || 0) * PPS.LINE_CLEARANCE[positionId];

	//// DRIBBLES
	// Succesfull dribbles (per 3) 
	tempPoints += (Math.floor(playerStat.dribblesSuccess / 3) || 0) * PPS.DRIBBLES_SUCCESS_PER_3[positionId];
	// Dribbled past (per 3) 
	tempPoints += (Math.floor(playerStat.dribblesPast / 3) || 0) * PPS.DRIBBLES_PAST_PER_3[positionId];
	
	//// FOULS
	// Commited fouls (per 3)
	tempPoints += (Math.floor(playerStat.foulsCommited / 3) || 0) * PPS.FOULS_COMMITED_PER_3[positionId];
	// Drawn fouls (per 3)
	tempPoints += (Math.floor(playerStat.foulsDrawn / 3) || 0) * PPS.FOULS_DRAWN_PER_3[positionId];

	//// DUELS
	// More GROUND duels won than lost
	tempPoints += (playerStat.duelsWon > playerStat.duelsTotal - playerStat.duelsWon) ? PPS.GR_DUELS_WON_MORE[positionId] : 0;
	// More AERIAL duels won than lost
	// tempPoints += (playerStat.aerialDuelsWon > playerStat.aerialDuelsTotal - playerStat.aerialDuelsWon) ? PPS.AER_DUELS_WON_MORE[positionId] : 0;

	//// MAGIC
	// Error leading to shot
	tempPoints += (playerStat.errorLeadingShot || 0) * PPS.ERROR_SHOT[positionId];
	// Error leading to goal
	tempPoints += (playerStat.errorLeadingGoal || 0) * PPS.ERROR_GOAL[positionId];
	// Big chances created
	tempPoints += (playerStat.bigChancesCreated || 0) * PPS.BIG_CHANCE_CREATED[positionId];
	// Big chances missed
	tempPoints += (playerStat.bigChancesMissed || 0) * PPS.BIG_CHANCE_MISSED[positionId];

	//// PENALTY'S
	// Penalty missed
	tempPoints += (playerStat.penaltyMissed || 0) * PPS.PENALTY_MISS[positionId];
	// Penalty won
	tempPoints += (playerStat.penaltyWon || 0) * PPS.PENALTY_WON[positionId];
	// Penalty commited
	tempPoints += (playerStat.penaltyCommited || 0) * PPS.PENALTY_COMMITED[positionId];

	//// CALCULATED	
	// Goals against
	tempPoints += (Math.floor(playerStat.goalsAgainst / 2) || 0) * PPS.CONCEDED_2[positionId];
	// Clean sheet
	tempPoints += (playerStat.minutesPlayed >= 60 && (playerStat.goalsAgainst || 0 ) === 0) ? PPS.CLEAN_SHEET[positionId] : 0;
	
	return tempPoints;
}