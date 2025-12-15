import { Request, Response } from "express";
import {
  getPlayersForMatching,
  generateTeamMatching,
} from "@/services/team-match.service";

/**
 * 선택된 플레이어들의 매칭용 데이터 조회
 * POST /api/team-match/players
 * Body: { playerIds: string[] }
 */
export const getPlayersData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { playerIds } = req.body;

    if (!playerIds || !Array.isArray(playerIds)) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "playerIds 배열이 필요합니다.",
        },
      });
      return;
    }

    if (playerIds.length !== 10) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_PLAYER_COUNT",
          message: "정확히 10명의 플레이어가 필요합니다.",
        },
      });
      return;
    }

    const players = await getPlayersForMatching(playerIds);

    res.status(200).json({
      success: true,
      message: "플레이어 데이터 조회 성공",
      data: { players },
    });
  } catch (error) {
    console.error("플레이어 데이터 조회 오류:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_ERROR",
        message:
          (error as Error).message || "플레이어 데이터 조회 중 오류 발생",
      },
    });
  }
};

/**
 * AI 팀 매칭 생성
 *
 * POST /api/team-match/generate
 *
 * Body: { playerIds: string[], positionCheck: boolean, requirements?: string }
 */
export const generateMatching = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { playerIds, positionCheck } = req.body;

    if (!playerIds || !Array.isArray(playerIds)) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "playerIds 배열이 필요합니다.",
        },
      });
      return;
    }

    if (playerIds.length !== 10) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_PLAYER_COUNT",
          message: "정확히 10명의 플레이어가 필요합니다.",
        },
      });
      return;
    }

    // 1. 플레이어 데이터 조회
    const players = await getPlayersForMatching(playerIds);

    // 2. AI 팀 매칭 생성
    const result = await generateTeamMatching(players, positionCheck);

    res.status(200).json({
      success: true,
      message: "AI 팀 매칭 생성 성공",
      data: result,
    });
  } catch (error) {
    console.error("AI 팀 매칭 오류:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "MATCHING_ERROR",
        message: (error as Error).message || "AI 팀 매칭 중 오류 발생",
      },
    });
  }
};
