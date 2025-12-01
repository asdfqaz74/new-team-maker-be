/**
 * Data Dragon 매퍼 유틸리티
 * ROFL 파일의 ID 값을 한글 이름으로 변환합니다.
 */

import itemData from "./item.json";
import summonerData from "./summoner.json";
import runesData from "./runesReforged.json";

// 타입 정의
interface ItemData {
  type: string;
  version: string;
  data: Record<
    string,
    {
      name: string;
      description: string;
      plaintext?: string;
      image: { full: string };
      gold: { total: number };
      tags: string[];
    }
  >;
}

interface SummonerSpellData {
  type: string;
  version: string;
  data: Record<
    string,
    {
      id: string;
      name: string;
      description: string;
      key: string;
      image: { full: string };
    }
  >;
}

interface Rune {
  id: number;
  key: string;
  icon: string;
  name: string;
  shortDesc?: string;
  longDesc?: string;
}

interface RuneStyle {
  id: number;
  key: string;
  icon: string;
  name: string;
  slots: { runes: Rune[] }[];
}

// 타입 캐스팅
const items = itemData as ItemData;
const summoners = summonerData as SummonerSpellData;
const runes = runesData as RuneStyle[];

// 소환사 주문 key -> name 매핑 (캐싱)
const summonerSpellMap = new Map<string, string>();
Object.values(summoners.data).forEach((spell) => {
  summonerSpellMap.set(spell.key, spell.name);
});

// 룬 ID -> 룬 정보 매핑 (캐싱)
const runeStyleMap = new Map<number, { name: string; icon: string }>();
const runeMap = new Map<number, Rune>();

runes.forEach((style) => {
  runeStyleMap.set(style.id, { name: style.name, icon: style.icon });
  style.slots.forEach((slot) => {
    slot.runes.forEach((rune) => {
      runeMap.set(rune.id, rune);
    });
  });
});

/**
 * 아이템 ID를 한글 이름으로 변환
 * @param itemId 아이템 ID (예: "6692")
 * @returns 아이템 한글 이름 (예: "월식") 또는 null
 */
export function getItemName(itemId: string | number): string | null {
  const id = String(itemId);
  if (id === "0") return null; // 빈 슬롯
  return items.data[id]?.name ?? null;
}

/**
 * 아이템 ID 배열을 한글 이름 배열로 변환
 * @param itemIds 아이템 ID 배열
 * @returns 아이템 한글 이름 배열 (빈 슬롯 제외)
 */
export function getItemNames(itemIds: (string | number)[]): string[] {
  return itemIds
    .map((id) => getItemName(id))
    .filter((name): name is string => name !== null);
}

/**
 * 아이템 상세 정보 조회
 * @param itemId 아이템 ID
 */
export function getItemInfo(itemId: string | number) {
  const id = String(itemId);
  if (id === "0") return null;
  const item = items.data[id];
  if (!item) return null;

  return {
    id,
    name: item.name,
    description: item.plaintext || "",
    image: item.image.full,
    gold: item.gold.total,
    tags: item.tags,
  };
}

/**
 * 소환사 주문 ID를 한글 이름으로 변환
 * @param spellKey 소환사 주문 key (예: "4")
 * @returns 소환사 주문 한글 이름 (예: "점멸") 또는 null
 */
export function getSummonerSpellName(spellKey: string | number): string | null {
  const key = String(spellKey);
  return summonerSpellMap.get(key) ?? null;
}

/**
 * 소환사 주문 ID 배열을 한글 이름 배열로 변환
 * @param spellKeys 소환사 주문 key 배열
 */
export function getSummonerSpellNames(
  spellKeys: (string | number)[]
): string[] {
  return spellKeys
    .map((key) => getSummonerSpellName(key))
    .filter((name): name is string => name !== null);
}

/**
 * 룬 스타일(계열) ID를 한글 이름으로 변환
 * @param styleId 룬 스타일 ID (예: 8100)
 * @returns 룬 스타일 한글 이름 (예: "지배") 또는 null
 */
export function getRuneStyleName(styleId: number): string | null {
  return runeStyleMap.get(styleId)?.name ?? null;
}

/**
 * 룬 ID를 한글 이름으로 변환
 * @param runeId 룬 ID (예: 8112)
 * @returns 룬 한글 이름 (예: "감전") 또는 null
 */
export function getRuneName(runeId: number): string | null {
  return runeMap.get(runeId)?.name ?? null;
}

/**
 * 룬 상세 정보 조회
 * @param runeId 룬 ID
 */
export function getRuneInfo(runeId: number) {
  const rune = runeMap.get(runeId);
  if (!rune) return null;

  return {
    id: rune.id,
    key: rune.key,
    name: rune.name,
    icon: rune.icon,
    description: rune.shortDesc || "",
  };
}

/**
 * ROFL 플레이어 데이터의 퍼크(룬) 정보를 한글로 변환
 * @param perks ROFL 파일의 perks 객체
 */
export function mapPerksToKorean(perks: {
  primaryStyle?: { style: number; keystone: number; selections?: number[] };
  subStyle?: { style: number; selections?: number[] };
  statMods?: number[];
}) {
  const result: {
    primaryStyle?: {
      style: string | null;
      keystone: string | null;
      selections?: (string | null)[];
    };
    subStyle?: {
      style: string | null;
      selections?: (string | null)[];
    };
    statMods?: number[];
  } = {};

  if (perks.primaryStyle) {
    result.primaryStyle = {
      style: getRuneStyleName(perks.primaryStyle.style),
      keystone: getRuneName(perks.primaryStyle.keystone),
      selections: perks.primaryStyle.selections?.map((id) => getRuneName(id)),
    };
  }

  if (perks.subStyle) {
    result.subStyle = {
      style: getRuneStyleName(perks.subStyle.style),
      selections: perks.subStyle.selections?.map((id) => getRuneName(id)),
    };
  }

  if (perks.statMods) {
    result.statMods = perks.statMods;
  }

  return result;
}

/**
 * ROFL 플레이어 데이터 전체를 한글로 변환
 */
export function mapPlayerDataToKorean(playerData: {
  items?: (string | number)[];
  summonerSpells?: (string | number)[];
  perks?: {
    primaryStyle?: { style: number; keystone: number; selections?: number[] };
    subStyle?: { style: number; selections?: number[] };
    statMods?: number[];
  };
}) {
  return {
    items: playerData.items ? getItemNames(playerData.items) : undefined,
    summonerSpells: playerData.summonerSpells
      ? getSummonerSpellNames(playerData.summonerSpells)
      : undefined,
    perks: playerData.perks ? mapPerksToKorean(playerData.perks) : undefined,
  };
}

// 버전 정보
export const DATA_DRAGON_VERSION = items.version;

export default {
  getItemName,
  getItemNames,
  getItemInfo,
  getSummonerSpellName,
  getSummonerSpellNames,
  getRuneStyleName,
  getRuneName,
  getRuneInfo,
  mapPerksToKorean,
  mapPlayerDataToKorean,
  DATA_DRAGON_VERSION,
};
