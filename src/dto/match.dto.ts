// 아이템
export interface ItemDTO {
  id: string;
  name: string | null;
}

// 룬 슬롯
export interface RuneSlotDTO {
  id: string;
  name: string | null;
}

// 룬 스타일
export interface RuneStyleDTO {
  id: string;
  name: string | null;
}

// 룬 전체
export interface PerksDTO {
  primaryStyle: {
    style: RuneStyleDTO;
    keystone: RuneSlotDTO;
    slots: RuneSlotDTO[];
  };
  subStyle: {
    style: RuneStyleDTO;
    slots: RuneSlotDTO[];
  };
  statPerks: string[];
}

// 소환사 주문
export interface SummonerSpellDTO {
  id: string;
  name: string | null;
}

// 메타데이터
export interface MatchMetadataDTO {
  gameLength: number;
  gameDuration: number;
  winTeam: "BLUE" | "RED";
  playTime: string;
}

// 플레이어 전체 데이터 (프리뷰 + 저장 공용)
export interface PlayerFullDTO {
  // 기본 정보
  champion: string;
  position: "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY";
  team: "BLUE" | "RED";
  win: boolean;
  level: string;

  // KDA
  kills: string;
  deaths: string;
  assists: string;

  // 멀티킬
  doubleKills: string;
  tripleKills: string;
  quadraKills: string;
  pentaKills: string;

  // 골드/CS
  goldEarned: string;
  creepScore: string;

  // 데미지 (마법)
  magicDamageDealt: string;
  magicDamageToChampions: string;
  magicDamageTaken: string;

  // 데미지 (물리)
  physicalDamageDealt: string;
  physicalDamageToChampions: string;
  physicalDamageTaken: string;

  // 데미지 (고정)
  trueDamageDealt: string;
  trueDamageToChampions: string;
  trueDamageTaken: string;

  // 데미지 (총합)
  totalDamageDealt: string;
  totalDamageToChampions: string;
  totalDamageTaken: string;

  // 시야
  visionScore: string;
  controlWardsBought: string;
  wardsKilled: string;
  wardsPlaced: string;

  // 아이템, 룬, 소환사 주문
  items: ItemDTO[];
  perks: PerksDTO;
  summonerSpells: SummonerSpellDTO[];

  // 원본 닉네임 (참고용)
  riotIdGameName: string;
  riotIdTagLine: string;
}

// 프리뷰 응답
export interface MatchPreviewResponseDTO {
  metadata: MatchMetadataDTO;
  blueTeam: PlayerFullDTO[];
  redTeam: PlayerFullDTO[];
}

// 저장 요청용 - 플레이어 매핑
export interface PlayerMappingDTO {
  index: number; // 팀 내 배열 인덱스 (0~4)
  team: "BLUE" | "RED";
  playerId: string; // 선택된 Player의 _id
}

// 저장 요청용 - 밴 챔피언
export interface BanChampionDTO {
  championId: string;
  name: string;
  _id: string;
}

// 저장 요청
export interface SaveMatchRequestDTO {
  metadata: MatchMetadataDTO;
  blueTeam: PlayerFullDTO[];
  redTeam: PlayerFullDTO[];
  playerMappings: PlayerMappingDTO[];
  playedAt?: string;
  banChampions: BanChampionDTO[];
}
