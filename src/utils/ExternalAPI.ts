import { prisma } from "./../db/client";
import axios from "axios";
import HttpError from "./HttpError";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const fetchPlayersPage = async (page: number = 1) => {
  const res = await axios.request({
    method: "get",
    url: "https://v3.football.api-sports.io/players",
    headers: {
      "x-rapidapi-key": process.env.EXTERNAL_API_KEY,
      "x-rapidapi-host": "v3.football.api-sports.io",
    },
    params: {
      league: process.env.LEAGUE_CODE,
      season: process.env.SEASON,
      page: page,
    },
  });
  if (
    res.status != 200 ||
    !res.data ||
    (Array.isArray(res.data.errors) && res.data.errors.length > 0) ||
    Object.keys(res.data.errors).length !== 0
  ) {
    throw new HttpError(
      Object.values(res.data.errors).reduce(
        (s, v) => `${s}${v} `,
        ""
      ) as string,
      429
    );
  }
  return res.data;
};

const fetchPlayersOfClubPage = async (page: number = 1, clubId: number) => {
  const res = await axios.request({
    method: "get",
    url: "https://v3.football.api-sports.io/players",
    headers: {
      "x-rapidapi-key": process.env.EXTERNAL_API_KEY,
      "x-rapidapi-host": "v3.football.api-sports.io",
    },
    params: {
      league: process.env.LEAGUE_CODE,
      season: process.env.SEASON,
      team: clubId,
      page: page,
    },
  });
  if (
    res.status != 200 ||
    !res.data ||
    (Array.isArray(res.data.errors) && res.data.errors.length > 0) ||
    Object.keys(res.data.errors).length !== 0
  ) {
    throw new HttpError(
      Object.values(res.data.errors).reduce(
        (s, v) => `${s}${v} `,
        ""
      ) as string,
      429
    );
  }
  return res.data;
};

export const fetchPlayers = async (
  req: any,
  clubs: {
    id: number;
    external: number;
  }[]
) => {
  try {
    const playersPageReq = await fetchPlayersPage(1);
    const playersPage = playersPageReq.response;

    req.log.info(
      `Importing players started: ${playersPageReq.paging.total} pages`
    );

    for (let page = 1; page <= playersPageReq.paging.total; page++) {
      await sleep(10000);
      req.log.info(`Fetching page ${page}`);
      const playersCurrentPageReq = await fetchPlayersPage(page);
      const playersCurrentPage = playersCurrentPageReq.response;
      const respToData = playersCurrentPage.map((playerObj: any) => ({
        externalId: playerObj.player.id,
        forename: playerObj.player.firstname,
        surname: playerObj.player.lastname,
        clubId: clubs.find(
          (c: any) => c.external === playerObj.statistics[0].team.id
        )?.id,
        captain: playerObj.statistics[0].games.captain ? 1 : 0,
        positionId: MapPositionNameToId(playerObj.statistics[0].games.position),
        name: `${playerObj.player.firstname} ${playerObj.player.lastname}`,
        short: playerObj.player.name,
        portraitUrl: playerObj.player.portraitUrl,
      }));
      try {
        const createdPlayers = await prisma.player.createMany({
          data: respToData,
        });
        req.log.info(`Saved players of page ${page}`);
      } catch (err: any) {
        req.log.error(`Error saving page ${page}: ${err}`);
        throw new Error("Prisma error: " + err);
      }
    }
  } catch (err: any) {
    req.log.info(`Something went wrong: ${err}`);
    throw err;
  }
};

export const fetchPlayersPerClub = async (
  req: any,
  clubs: {
    id: number;
    external: number;
  }[]
) => {
  for (let club of clubs) {
	// await sleep(50000);
    req.log.info(`Starting to import players of club: ${club.id}`);
    try {
      const playersPageReq = await fetchPlayersOfClubPage(1, club.external);
      const playersPage = playersPageReq.response;

      req.log.info(
        `Importing players (club ${club.id}) started: ${playersPageReq.paging.total} pages`
      );

      for (let page = 1; page <= playersPageReq.paging.total; page++) {
		await sleep(10000);
        req.log.info(`Fetching club ${club.id}, page ${page}`);
        const playersCurrentPageReq = await fetchPlayersOfClubPage(
          page,
          club.external,
        );
        const playersCurrentPage = playersCurrentPageReq.response;
        const respToData = playersCurrentPage.map((playerObj: any) => ({
          externalId: playerObj.player.id,
          forename: playerObj.player.firstname,
          surname: playerObj.player.lastname,
          clubId: club.id,
          captain: playerObj.statistics[0].games.captain ? 1 : 0,
          positionId: MapPositionNameToId(
            playerObj.statistics[0].games.position
          ),
          name: `${playerObj.player.firstname} ${playerObj.player.lastname}`,
          short: playerObj.player.name,
          portraitUrl: playerObj.player.portraitUrl,
        }));
        try {
          const createdPlayers = await prisma.player.createMany({
            data: respToData,
          });
          req.log.info(`Saved players (club ${club.id}) of page ${page}`);
        } catch (err: any) {
          req.log.error(`Error saving page ${page}: ${err}`);
          throw new Error("Prisma error: " + err);
        }
      }
    } catch (err: any) {
      req.log.info(
        `Something went wrong while fetching player of club ${club.id}: ${err}`
      );
      throw err;
    }
  }
};

const MapPositionNameToId = (positionName: string) => {
  if (positionName === "Goalkeeper") {
    return 1;
  }
  if (positionName === "Defender") {
    return 2;
  }
  if (positionName === "Midfielder") {
    return 3;
  }
  if (positionName === "Attacker") {
    return 4;
  }
  return -1;
};
