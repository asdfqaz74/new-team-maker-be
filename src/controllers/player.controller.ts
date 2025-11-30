import { getLineOptions, verifyPlayer } from "@/services/player.service";
import { Request, Response } from "express";

// export const register = async (req: Request, res: Response): Promise<void> => {
//     try {
//         const
//     }
// };

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

/* -------------------------------------------- */
/*                      기타                      */
/* -------------------------------------------- */
// 콤보박스에 들어갈 라인 정보 조회 컨트롤러
export const getLine = async (res: Response): Promise<void> => {
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
