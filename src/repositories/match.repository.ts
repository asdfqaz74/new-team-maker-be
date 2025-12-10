import { PlayerStats } from "@/models/match.model";

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
