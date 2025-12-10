import { PlayerStats } from "@/models/match.model";

// 플레이어 최근 통계 조회
export const getPlayerRecentStats = async (
  playerId: string
): Promise<any[]> => {
  const stats = await PlayerStats.find({ playerId });

  return stats;
};
