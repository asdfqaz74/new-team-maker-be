import { getUserDashboardRecentMatches } from "@/services/match.service";
import { getMyPagePlayerList } from "@/services/player.service";
import { Request, Response } from "express";

export const getRegisteredPlayers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "사용자 인증에 실패했습니다.",
      });
      return;
    }

    const players = await getMyPagePlayerList(userId);

    const list = {
      first: players.playersRowFirst,
      second: players.playersRowSecond,
    };

    res.status(200).json({
      success: true,
      message: "마이페이지 플레이어 목록을 성공적으로 조회했습니다.",
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "마이페이지 플레이어 목록 조회에 실패했습니다.",
      error: (error as Error).message,
    });
  }
};

export const getRecentMatches = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "사용자 인증에 실패했습니다.",
      });
      return;
    }

    const recentMatches = await getUserDashboardRecentMatches(userId);

    res.status(200).json({
      success: true,
      message: "최근 매치 목록을 성공적으로 조회했습니다.",
      data: recentMatches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "최근 매치 목록 조회에 실패했습니다.",
      error: (error as Error).message,
    });
  }
};
