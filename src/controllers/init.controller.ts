import { initService } from "@/services/init.service";
import { Request, Response } from "express";

export const getInitData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const initData = await initService();

    res.status(200).json({
      success: true,
      data: initData,
      message: "초기 설정 데이터를 성공적으로 조회했습니다.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "초기 설정 데이터 조회에 실패했습니다.",
    });
  }
};
