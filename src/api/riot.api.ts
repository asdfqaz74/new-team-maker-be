import axios from "axios";

export const riotApi = axios.create({
  baseURL: "https://asia.api.riotgames.com",
  headers: {
    "X-Riot-Token": process.env.RIOT_API_KEY || "",
  },
});
