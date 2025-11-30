import axios from "axios";

export const riotApi = axios.create({
  baseURL: "https://asia.api.riotgames.com",
  headers: {
    "X-Riot-Token": process.env.RIOT_API_KEY || "",
  },
});

const addApiKey = (config: any) => {
  config.headers["X-Riot-Token"] = process.env.RIOT_API_KEY || "";
  return config;
};

riotApi.interceptors.request.use(addApiKey);
