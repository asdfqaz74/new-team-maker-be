import { riotApi } from "@/api/riot.api";
import Player from "@/models/player.model";
import {
  getPlayersDetailList,
  getSimplePlayerList,
} from "@/repositories/player.repository";
interface PlayerPUUID {
  puuid: string;
}

/* -------------------------------------------- */
/*                    플레이어 등록                   */
/* -------------------------------------------- */

// 플레이어 정보 등록
// - 플레이어 이름
// - 플레이어 닉네임
// - 주 포지션
// - 서브 포지션
// - 서브 포지션2(선택)

// 로직
// 1. 플레이어 정보 이름 / 닉네임(닉네임 + 태그) 인풋기입
// 2. 플레이어 확인(Riot API) -> puuid 획득
// 3. 주 포지션 선택
// 4. 서브 포지션1 선택
// 5. 서브 포지션2 선택(선택사항)
// 6. 플레이어 정보 저장 (DB 저장)
// 7. 플레이어 정보는 유저에서 참조하는 형태로 구현

// 플레이어 확인
export const verifyPlayer = async (
  gameName: string,
  tagLine: string
): Promise<PlayerPUUID> => {
  // Riot API 호출
  const riotAPIResponse = await riotApi.get(
    `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
      gameName
    )}/${encodeURIComponent(tagLine)}`
  );

  const puuid = riotAPIResponse.data.puuid;

  return { puuid };
};

// 플레이어 등록
export interface RegisterPlayerData {
  realName: string;
  gameName: string;
  tagLine: string;
  puuid: string;
  mainPosition: string;
  subPosition: string;
  subPosition2?: string;
  owner: string;
}

export const registerPlayer = async (data: RegisterPlayerData) => {
  const player = await Player.create(data);
  return player;
};

// 플레이어 정보 수정
export interface UpdatePlayerData {
  realName?: string;
  gameName?: string;
  tagLine?: string;
  puuid?: string;
  mainPosition?: string;
  subPosition?: string;
  subPosition2?: string;
}

export const updatePlayer = async (
  playerId: string,
  data: UpdatePlayerData
) => {
  // undefined가 아닌 값만 필터링
  const updateData = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== undefined)
  );

  if (Object.keys(updateData).length === 0) {
    return null;
  }

  const updatedPlayer = await Player.findByIdAndUpdate(playerId, updateData, {
    new: true,
  });

  return updatedPlayer;
};
/* -------------------------------------------- */
/*                콤보박스에 들어갈 라인 정보               */
/* -------------------------------------------- */

// 라인 옵션 반환
export const getLineOptions = () => {
  return [
    { value: "TOP", label: "탑" },
    { value: "JUNGLE", label: "정글" },
    { value: "MIDDLE", label: "미드" },
    { value: "BOTTOM", label: "원딜" },
    { value: "UTILITY", label: "서포터" },
  ];
};

// 로그인 시 해당 유저의 플레이어 목록 조회 (간단한 정보)
export const getPlayers = async (userId: string) => {
  const players = await getSimplePlayerList(userId);

  return players;
};

// 플레이어 상세 정보 조회
export const getPlayersDetail = async (userId: string) => {
  const players = await getPlayersDetailList(userId);

  return players;
};
