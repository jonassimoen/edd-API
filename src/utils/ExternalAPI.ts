
import axios from "axios";
import HttpError from "./HttpError";

const fetchPlayersPage = async (page: number = 1) => {
    const res = await axios.request({
        method: 'get',
        url: 'https://v3.football.api-sports.io/players',
        headers: {
            'x-rapidapi-key': process.env.EXTERNAL_API_KEY,
            'x-rapidapi-host': 'v3.football.api-sports.io'
        },
        params: {
            'league': 1,
            'season': 2022,
            'page': page,
        }
    });

    console.log(Object.keys(res.data.errors));
    if (res.status != 200 || !res.data || (Array.isArray(res.data.errors) && (res.data.errors.length > 0)) || Object.keys(res.data.errors).length !== 0) {
        throw new HttpError(Object.values(res.data.errors).reduce((s, v) => `${s}${v} `, '') as string, 429)
    }
    return res.data;
}


const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export const fetchPlayers = async (page: number = 1, allPlayers = []) => {
    // let ps = await fetchPlayersPage(page);
    // allPlayers = allPlayers.concat(ps.response);
    // console.log(allPlayers);
    // return
    try {
        let ps = await fetchPlayersPage(page);
        allPlayers = allPlayers.concat(ps.response);

        if (ps.paging && ps.paging.current < ps.paging.total) {
            console.log(`Fetched page ${page} from ${ps.paging.total}`)
            if (page % 10 === 0) {
                await sleep(60000);
            }

            page = ps.paging.current + 1;
            allPlayers = await fetchPlayers(page, allPlayers)
        } else {
            console.log("fetched fully");
        }
        return allPlayers;
    } catch (err: any) {
        console.log(`Something went wrong: ${err}`)
        throw err;
    }

}

export const MapPositionNameToId = (positionName: string) => {
    if(positionName === "Goalkeeper") {
        return 1;
    };
    if(positionName === "Defender") {
        return 2;
    };
    if(positionName === "Midfielder") {
        return 3;
    };
    if(positionName === "Attacker") {
        return 4; 
    };
    return -1;
}