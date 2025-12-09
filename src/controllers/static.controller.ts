import {
  getMostPickedChampions,
  getOtherMainStaticData,
} from "@/services/static.service";
import { Request, Response } from "express";

// 가장 많이 픽된 챔피언 통계 조회
export const getMainStaticData = async (req: Request, res: Response) => {
  try {
    // 서비스에서 데이터 조회
    const mostPickedChampions = await getMostPickedChampions();

    res.status(200).json({
      success: true,
      data: { mostPickedChampions },
      message: "가장 많이 픽된 챔피언 통계 조회 성공",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "가장 많이 픽된 챔피언 통계 조회 실패",
    });
  }
};

// 나머지 메인 페이지 통계 데이터 조회
export const getOtherStaticData = async (req: Request, res: Response) => {
  try {
    // 서비스에서 데이터 조회
    const otherMainStaticData = await getOtherMainStaticData();

    res.status(200).json({
      success: true,
      data: otherMainStaticData,
      message: "메인 페이지 기타 통계 데이터 조회 성공",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "메인 페이지 기타 통계 데이터 조회 실패",
    });
  }
};
