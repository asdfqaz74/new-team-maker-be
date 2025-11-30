interface PlayerPUUID {
  puuid: string;
}

/* -------------------------------------------- */
/*                    플레이어 등록                   */
/* -------------------------------------------- */

import axios from "axios";

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

export const registerPlayer = async () => {};

// 플레이어 확인
export const verifyPlayer = async (
  gameName: string,
  tagLine: string
): Promise<PlayerPUUID> => {
  // Riot API 호출
  const riotAPIResponse = await axios.get(
    `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
      gameName
    )}/${encodeURIComponent(tagLine)}`,
    {
      headers: {
        "X-Riot-Token": process.env.RIOT_API_KEY,
      },
    }
  );

  const puuid = riotAPIResponse.data.puuid;

  return { puuid };
};

/* -------------------------------------------- */
/*                콤보박스에 들어갈 라인 정보               */
/* -------------------------------------------- */

export const getLineOptions = () => {
  return [
    { value: "TOP", label: "탑" },
    { value: "JUNGLE", label: "정글" },
    { value: "MIDDLE", label: "미드" },
    { value: "BOTTOM", label: "원딜" },
    { value: "UTILITY", label: "서포터" },
  ];
};
