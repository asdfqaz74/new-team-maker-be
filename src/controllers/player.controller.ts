import {
  getLineOptions,
  getPlayers,
  getPlayersDetail,
  registerPlayer,
  updatePlayer,
  verifyPlayer,
} from "@/services/player.service";
import { Request, Response } from "express";

// 플레이어 PUUID 조회 컨트롤러
export const verify = async (req: Request, res: Response): Promise<void> => {
  try {
    const { gameName, tagLine } = req.query;

    if (!gameName || !tagLine) {
      res.status(400).json({
        success: false,
        message: "닉네임과 태그라인을 모두 입력해주세요.",
      });
      return;
    }

    const { puuid } = await verifyPlayer(gameName as string, tagLine as string);

    res.status(200).json({
      success: true,
      message: "해당 플레이어의 PUUID를 성공적으로 조회했습니다.",
      data: {
        puuid: puuid,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "플레이어의 PUUID 조회에 실패했습니다.",
      error: (error as Error).message,
    });
  }
};

// 플레이어 등록 컨트롤러
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      realName,
      gameName,
      tagLine,
      puuid,
      mainPosition,
      subPosition,
      subPosition2,
    } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: "사용자 인증에 실패했습니다." });
      return;
    }

    if (!gameName || !tagLine) {
      res
        .status(400)
        .json({
          success: false,
          message: "닉네임과 태그라인을 모두 입력해주세요.",
        });
      return;
    }

    if (!mainPosition) {
      res
        .status(400)
        .json({ success: false, message: "주 포지션을 입력해주세요." });
      return;
    }

    if (!subPosition) {
      res
        .status(400)
        .json({ success: false, message: "부 포지션을 입력해주세요." });
      return;
    }

    await registerPlayer({
      realName,
      gameName,
      tagLine,
      puuid,
      mainPosition,
      subPosition,
      subPosition2,
      owner: userId,
    });

    res
      .status(200)
      .json({
        success: true,
        message: "해당 플레이어를 성공적으로 등록했습니다.",
      });
  } catch (error) {
    if ((error as any).code === 11000) {
      res
        .status(409)
        .json({ success: false, message: "이미 등록된 플레이어입니다." });
      return;
    }

    res
      .status(500)
      .json({ success: false, message: "플레이어 등록에 실패했습니다." });
  }
};

// 플레이어 정보 수정 컨트롤러
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { playerId } = req.params;
    const {
      realName,
      gameName,
      tagLine,
      puuid,
      mainPosition,
      subPosition,
      subPosition2,
    } = req.body;

    const updatedPlayer = await updatePlayer(playerId, {
      realName,
      gameName,
      tagLine,
      puuid,
      mainPosition,
      subPosition,
      subPosition2,
    });

    if (!updatedPlayer) {
      res.status(400).json({
        success: false,
        message: "수정할 정보를 입력해주세요.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "플레이어 정보를 성공적으로 수정했습니다.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "플레이어 정보 수정에 실패했습니다.",
      error: (error as Error).message,
    });
  }
};

/* -------------------------------------------- */
/*                      기타                      */
/* -------------------------------------------- */
// 콤보박스에 들어갈 라인 정보 조회 컨트롤러
export const getLine = async (req: Request, res: Response): Promise<void> => {
  try {
    const lineOptions = getLineOptions();

    res.status(200).json({
      success: true,
      message: "라인 옵션을 성공적으로 조회했습니다.",
      data: {
        lineOptions: lineOptions,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "라인 옵션 조회에 실패했습니다.",
      error: (error as Error).message,
    });
  }
};

// 로그인 시 해당 유저의 플레이어 목록 조회 컨트롤러 (콤보박스용)
export const getPlayersList = async (
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

    const list = await getPlayers(userId);

    res.status(200).json({
      success: true,
      message: "해당 유저의 플레이어 목록을 성공적으로 조회했습니다.",
      data: {
        list,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "플레이어 목록 조회에 실패했습니다.",
      error: (error as Error).message,
    });
  }
};

// 해당 유저의 플레이어 상세 정보 조회 컨트롤러
export const getPlayersListDetail = async (
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

    const player = await getPlayersDetail(userId);

    res.status(200).json({
      success: true,
      message: "해당 플레이어의 상세 정보를 성공적으로 조회했습니다.",
      data: {
        player,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "플레이어 상세 정보 조회에 실패했습니다.",
      error: (error as Error).message,
    });
  }
};
