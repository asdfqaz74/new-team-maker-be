import {
  getHighestBanRateChampion,
  getHighestWinRateChampion,
  getHighestWinRateChampionsByPosition,
  getMostPickedChampion,
  getTopPlayersByWinRate,
} from "@/repositories/static.repository";

// 가장 많이 픽된 챔피언 탑10 조회 서비스
export const getMostPickedChampions = async () => {
  const mostPickedChampionsList = await getMostPickedChampion();

  return mostPickedChampionsList;
};

// 나머지 테이블에 들어갈 데이터 조회 서비스
// 승률, 밴률, 포지션별, 플레이어
export const getOtherMainStaticData = async () => {
  const highestWinRateChampions = await getHighestWinRateChampion();
  const highestBanRateChampions = await getHighestBanRateChampion();

  const highestWinRateChampionsByPositionTOP =
    await getHighestWinRateChampionsByPosition("TOP");
  const highestWinRateChampionsByPositionJUNGLE =
    await getHighestWinRateChampionsByPosition("JUNGLE");
  const highestWinRateChampionsByPositionMIDDLE =
    await getHighestWinRateChampionsByPosition("MIDDLE");
  const highestWinRateChampionsByPositionBOTTOM =
    await getHighestWinRateChampionsByPosition("BOTTOM");
  const highestWinRateChampionsByPositionUTILITY =
    await getHighestWinRateChampionsByPosition("UTILITY");

  const highestWinRateChampionsByPosition = {
    TOP: highestWinRateChampionsByPositionTOP,
    JUNGLE: highestWinRateChampionsByPositionJUNGLE,
    MIDDLE: highestWinRateChampionsByPositionMIDDLE,
    BOTTOM: highestWinRateChampionsByPositionBOTTOM,
    UTILITY: highestWinRateChampionsByPositionUTILITY,
  };
  const topPlayersByWinRate = await getTopPlayersByWinRate();

  return {
    highestWinRateChampions,
    highestBanRateChampions,
    highestWinRateChampionsByPosition,
    topPlayersByWinRate,
  };
};
