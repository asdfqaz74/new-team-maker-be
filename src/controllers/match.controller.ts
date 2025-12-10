import { Request, Response } from "express";
import { deleteUploadedFile } from "../middlewares/upload.middleware";
import {
  parseAndPreview,
  saveMatch,
  deleteMatch,
  getRecentMatchesByPlayer,
} from "../services/match.service";
import { SaveMatchRequestDTO } from "../dto/match.dto";

// 매치 업로드 (프리뷰)
export const upload = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;

    // 파일 없으면 에러
    if (!file) {
      res.status(400).json({
        success: false,
        error: { code: "NO_FILE", message: "ROFL 파일이 필요합니다." },
      });
      return;
    }

    // ROFL 파싱 + DTO 변환
    const previewData = parseAndPreview(file.path);

    // 파싱 완료 후 파일 삭제
    deleteUploadedFile(file.path);

    res.status(200).json({
      success: true,
      message: "파일 업로드에 성공했습니다.",
      data: previewData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: "UPLOAD_ERROR", message: "파일 업로드 중 오류 발생" },
    });
  }
};

// 매치 저장
export const save = async (req: Request, res: Response): Promise<void> => {
  try {
    const data: SaveMatchRequestDTO = req.body;

    // 유효성 검사
    if (
      !data.metadata ||
      !data.blueTeam ||
      !data.redTeam ||
      !data.playerMappings
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_DATA",
          message: "필수 데이터가 누락되었습니다.",
        },
      });
      return;
    }

    if (data.playerMappings.length !== 10) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_MAPPING",
          message: "10명의 플레이어 매핑이 필요합니다.",
        },
      });
      return;
    }

    // 매치 저장
    const result = await saveMatch(data);

    res.status(201).json({
      success: true,
      data: result,
      message: "매치가 성공적으로 저장되었습니다.",
    });
  } catch (error) {
    console.error("매치 저장 오류:", error);
    res.status(500).json({
      success: false,
      error: { code: "SAVE_ERROR", message: "매치 저장 중 오류 발생" },
    });
  }
};

// 매치 삭제
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const { matchId } = req.params;

    if (!matchId) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "매치 ID가 필요합니다." },
      });
      return;
    }

    await deleteMatch(matchId);

    res.status(200).json({
      success: true,
      message: "매치가 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("매치 삭제 오류:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "DELETE_ERROR",
        message: (error as Error).message || "매치 삭제 중 오류 발생",
      },
    });
  }
};

// 플레이어 최근 매치 조회
export const getRecentMatches = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { playerId } = req.params;
    const pageIndex = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 5;

    if (!playerId) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "플레이어 ID가 필요합니다." },
      });
      return;
    }

    const result = await getRecentMatchesByPlayer(
      playerId,
      pageIndex,
      pageSize
    );

    res.status(200).json({
      success: true,
      message: "플레이어의 최근 매치 조회에 성공했습니다.",
      data: result,
    });
  } catch (error) {
    console.error("플레이어 최근 매치 조회 오류:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "RETRIEVE_ERROR",
        message:
          (error as Error).message || "플레이어 최근 매치 조회 중 오류 발생",
      },
    });
  }
};
