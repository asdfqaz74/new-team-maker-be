import Init from "@/models/init.model";

// 버전 조회
export const getVersion = async (): Promise<string> => {
  const result = await Init.findOne()
    .sort({ createdAt: -1 })
    .select({ version: 1 });

  return result?.version || "";
};
