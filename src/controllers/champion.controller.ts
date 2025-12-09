// 챔피언 목록 조회 컨트롤러

import { getChampionDataList } from "@/repositories/champion.repository";
import { Request, Response } from "express";

/** 챔피언 목록 조회(간단) */
export const getChampionsSimpleList = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const championList = await getChampionDataList();

    res.status(200).json({
      success: true,
      data: { championList },
      message: "챔피언 목록을 성공적으로 조회했습니다.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "챔피언 목록 조회에 실패했습니다.",
    });
  }
};
