import { ChampionStats, PlayerRankStats } from "@/models/static.model";

// 가장 많이 픽된 챔피언 조회
export const getMostPickedChampion = async () => {
  const champions = await ChampionStats.find()
    .sort({ pickRate: -1 })
    .limit(10)
    .select("championName championId totalGames pickRate winRate");

  return champions;
};

// 승률이 높은 챔피언 조회
export const getHighestWinRateChampion = async () => {
  const champions = await ChampionStats.find()
    .sort({ winRate: -1 })
    .limit(10)
    .select("championName championId totalGames pickRate winRate");
  return champions;
};

// 밴률이 높은 챔피언 조회
export const getHighestBanRateChampion = async () => {
  const champions = await ChampionStats.find()
    .sort({ banRate: -1 })
    .limit(10)
    .select("championName championId totalGames pickRate winRate");
  return champions;
};

// 포지션별 승률 높은 챔피언 조회
export const getHighestWinRateChampionsByPosition = async (
  position: string
) => {
  const validPositions = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];
  if (!validPositions.includes(position)) {
    throw new Error("유효하지 않은 포지션입니다.");
  }

  // byPosition.TOP.games 같은 형태로 접근
  const gamesField = `byPosition.${position}.games`;
  const winRateField = `byPosition.${position}.winRate`;

  const champions = await ChampionStats.find({
    [gamesField]: { $gte: 1 }, // 해당 포지션에서 1게임 이상 플레이
  })
    .sort({ [winRateField]: -1 })
    .limit(5)
    .select(`championName championId byPosition.${position}`);

  return champions;
};

// 승률이 높은 플레이어 탑10 조회
export const getTopPlayersByWinRate = async () => {
  const players = await PlayerRankStats.find()
    .sort({ winRate: -1 })
    .limit(10)
    .select("playerId gameName tagLine totalGames winRate");

  return players;
};
