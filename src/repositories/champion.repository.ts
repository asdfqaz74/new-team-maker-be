import Champion from "@/models/champion.model";

// 챔피언 정보 조회 (간단)
export const getChampionDataList = async (): Promise<any[]> => {
  const champions = await Champion.find().select({
    championId: 1,
    name: 1,
    _id: 1,
  });

  return champions;
};
