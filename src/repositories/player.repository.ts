import Player from "@/models/player.model";

// 플레이어 목록 조회 (간단한 정보)
export const getSimplePlayerList = async (userId: string): Promise<any[]> => {
  const players = await Player.find({ owner: userId });

  const list = players.map((player) => ({
    _id: player._id,
    realName: player.realName,
    gameName: player.gameName,
    tagLine: player.tagLine,
  }));
  return list;
};

// 플레이어 상세 정보 조회
export const getPlayersDetailList = async (userId: string): Promise<any[]> => {
  const players = await Player.find({ owner: userId }).select(
    "-owner -__v -createdAt -updatedAt"
  );

  return players;
};

// 플레이어 아이디 조회
export const getPlayerIdById = async (
  playerId: string
): Promise<any | null> => {
  return await Player.find({ _id: playerId }).select(
    "-__v -createdAt -updatedAt"
  );
};
