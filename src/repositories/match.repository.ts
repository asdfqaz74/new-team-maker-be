import { Match, PlayerStats } from "@/models/match.model";

interface PaginationParams {
  playerId: string;
  pageIndex: number;
  pageSize: number;
}

interface PaginatedResult {
  data: any[];
  totalCount: number;
}

// 플레이어 최근 매치 조회 (페이지네이션)
export const getPlayerRecentStats = async ({
  playerId,
  pageIndex,
  pageSize,
}: PaginationParams): Promise<PaginatedResult> => {
  const skip = (pageIndex - 1) * pageSize;

  const [data, totalCount] = await Promise.all([
    PlayerStats.find({ playerId })
      .select("-__v -createdAt -updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    PlayerStats.countDocuments({ playerId }),
  ]);

  return { data, totalCount };
};

// 유저의 최근 매치 조회 최대5경기 (대시보드)
export const getUserRecentMatches = async (userId: string): Promise<any[]> => {
  // 1. Match에서 owner로 최근 5경기 조회
  const recentMatches = await Match.find({ owner: userId })
    .select("_id metadata playedAt")
    .sort({ playedAt: -1 })
    .limit(5)
    .lean();

  if (recentMatches.length === 0) {
    return [];
  }

  // 2. 해당 매치들의 PlayerStats 조회
  const matchIds = recentMatches.map((m) => m._id);
  const playerStats = await PlayerStats.find({ matchId: { $in: matchIds } })
    .select("-__v -createdAt -updatedAt")
    .lean();

  // 3. 매치별로 그룹핑하여 반환
  return recentMatches.map((match) => ({
    ...match,
    players: playerStats.filter(
      (ps) => ps.matchId.toString() === match._id.toString()
    ),
  }));
};
