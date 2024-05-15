export const isValidLineup = (players: {
    id: number;
    clubId: number | null;
    positionId: number | null;
    value: number | null;
}[]) => {
	const startingPos = players.reduce((res: number[], cur: any) => {
		res[cur.positionId] = (res[cur.positionId] || 0) + 1;
		return res;
	}, [0,0,0,0,0]);

	if(startingPos[1] != 1) 
		return false
	if(startingPos[2] > 5 || startingPos[2] < 3 || startingPos[3] > 5 || startingPos[3] < 3 || startingPos[4] > 3 || startingPos[4] < 1)
		return false


	const possibleLineups = [
		[0,1,3,4,3],
		[0,1,3,5,2],
		[0,1,4,3,3],
		[0,1,4,4,2],
		[0,1,4,5,1],
		[0,1,5,3,2],
		[0,1,5,4,1],
	]
	return possibleLineups.some(row => row.toString() === startingPos.toString());
}