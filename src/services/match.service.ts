import {
  parseRoflFile,
  PlayerStats as ParsedPlayerStats,
} from "../../utils/rofl-parser";
import {
  MatchPreviewResponseDTO,
  MatchMetadataDTO,
  PlayerFullDTO,
  SaveMatchRequestDTO,
} from "../dto/match.dto";
import { Match, PlayerStats } from "../models/match.model";
import Player from "../models/player.model";
import {
  ChampionStats,
  GlobalStats,
  PlayerRankStats,
} from "../models/static.model";
import Champion from "../models/champion.model";
import mongoose from "mongoose";
import { getPlayerRecentStats } from "@/repositories/match.repository";

// ============================================
// 타입 정의
// ============================================

type Position = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY";

interface PlayerStatsDocInput {
  playerId: mongoose.Types.ObjectId;
  champion: string;
  position: string;
  win: boolean;
}

// ============================================
// 상수
// ============================================

const POSITION_ORDER = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

// ============================================
// 유틸리티 함수
// ============================================

/** 포지션 순서대로 정렬 */
const sortByPosition = (players: ParsedPlayerStats[]): ParsedPlayerStats[] => {
  return [...players].sort(
    (a, b) =>
      POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position)
  );
};

/** 승률 계산 (소수점 2자리) */
const calcWinRate = (wins: number, total: number): number =>
  total > 0 ? Math.round((wins / total) * 100 * 100) / 100 : 0;

/** 비율 계산 (소수점 2자리) */
const calcRate = (value: number, total: number): number =>
  Math.round((value / Math.max(total, 1)) * 100 * 100) / 100;

/** 파싱된 PlayerStats를 PlayerFullDTO로 변환 */
const toPlayerFullDTO = (player: ParsedPlayerStats): PlayerFullDTO => ({
  champion: player.champion,
  position: player.position as PlayerFullDTO["position"],
  team: player.team,
  win: player.win,
  level: player.level,
  kills: player.kills,
  deaths: player.deaths,
  assists: player.assists,
  doubleKills: player.doubleKills,
  tripleKills: player.tripleKills,
  quadraKills: player.quadraKills,
  pentaKills: player.pentaKills,
  goldEarned: player.goldEarned,
  creepScore: player.creepScore,
  magicDamageDealt: player.magicDamageDealt,
  magicDamageToChampions: player.magicDamageToChampions,
  magicDamageTaken: player.magicDamageTaken,
  physicalDamageDealt: player.physicalDamageDealt,
  physicalDamageToChampions: player.physicalDamageToChampions,
  physicalDamageTaken: player.physicalDamageTaken,
  trueDamageDealt: player.trueDamageDealt,
  trueDamageToChampions: player.trueDamageToChampions,
  trueDamageTaken: player.trueDamageTaken,
  totalDamageDealt: player.totalDamageDealt,
  totalDamageToChampions: player.totalDamageToChampions,
  totalDamageTaken: player.totalDamageTaken,
  visionScore: player.visionScore,
  controlWardsBought: player.controlWardsBought,
  wardsKilled: player.wardsKilled,
  wardsPlaced: player.wardsPlaced,
  items: player.items,
  perks: player.perks,
  summonerSpells: player.summonerSpells,
  riotIdGameName: player.riotIdGameName,
  riotIdTagLine: player.riotIdTagLine,
});

// ============================================
// ROFL 파싱 (프리뷰)
// ============================================

/** ROFL 파일 파싱 후 프리뷰 DTO로 변환 */
export const parseAndPreview = (filePath: string): MatchPreviewResponseDTO => {
  const parsed = parseRoflFile(filePath);

  if (!parsed.stats) {
    throw new Error("플레이어 스탯을 찾을 수 없습니다.");
  }

  const bluePlayers = sortByPosition(
    parsed.stats.filter((p) => p.team === "BLUE")
  );
  const redPlayers = sortByPosition(
    parsed.stats.filter((p) => p.team === "RED")
  );

  const metadata: MatchMetadataDTO = {
    gameLength: parsed.metadata.gameLength,
    gameDuration: parsed.metadata.gameDuration,
    winTeam: parsed.metadata.winTeam,
    playTime: parsed.metadata.playTime,
  };

  return {
    metadata,
    blueTeam: bluePlayers.map(toPlayerFullDTO),
    redTeam: redPlayers.map(toPlayerFullDTO),
  };
};

// ============================================
// 매치 저장
// ============================================

/** 매치 저장 메인 함수 */
export const saveMatch = async (data: SaveMatchRequestDTO) => {
  // 1. 밴 챔피언 ObjectId 배열 생성
  const banChampionIds =
    data.banChampions?.map((ban) => new mongoose.Types.ObjectId(ban._id)) || [];

  // 2. Match 문서 생성
  const match = await Match.create({
    metadata: data.metadata,
    playedAt: data.playedAt ? new Date(data.playedAt) : new Date(),
    banChampions: banChampionIds,
  });

  // 3. PlayerStats 문서 생성 및 저장
  const playerStatsDocs = await buildPlayerStatsDocs(data, match._id);
  await PlayerStats.insertMany(playerStatsDocs);

  // 4. 플레이어 최근 통계 업데이트
  const uniquePlayerIds = [
    ...new Set(data.playerMappings.map((m) => m.playerId)),
  ];
  await Promise.all(uniquePlayerIds.map(updatePlayerRecentStats));

  // 5. 전체 통계 업데이트
  await updateStatisticsOnSave(
    playerStatsDocs.map((doc) => ({
      playerId: doc.playerId,
      champion: doc.champion,
      position: doc.position,
      win: doc.win,
    })),
    banChampionIds
  );

  return { matchId: match._id };
};

/** PlayerStats 문서 배열 생성 */
const buildPlayerStatsDocs = async (
  data: SaveMatchRequestDTO,
  matchId: mongoose.Types.ObjectId
) => {
  // 플레이어 정보 조회
  const playerIds = data.playerMappings.map((m) => m.playerId);
  const players = await Player.find({ _id: { $in: playerIds } });
  const playerMap = new Map(players.map((p) => [p._id.toString(), p]));

  // 팀 데이터 합치기
  const allPlayers = [
    ...data.blueTeam.map((p, idx) => ({
      ...p,
      _team: "BLUE" as const,
      _index: idx,
    })),
    ...data.redTeam.map((p, idx) => ({
      ...p,
      _team: "RED" as const,
      _index: idx,
    })),
  ];

  return allPlayers.map((player) => {
    const mapping = data.playerMappings.find(
      (m) => m.team === player._team && m.index === player._index
    );
    if (!mapping) {
      throw new Error(`매핑 정보 없음: ${player._team} ${player._index}`);
    }

    const playerInfo = playerMap.get(mapping.playerId);
    if (!playerInfo) {
      throw new Error(`플레이어 없음: ${mapping.playerId}`);
    }

    return {
      matchId,
      playerId: new mongoose.Types.ObjectId(mapping.playerId),
      riotIdGameName: playerInfo.gameName,
      riotIdTagLine: playerInfo.tagLine,
      champion: player.champion,
      position: player.position,
      team: player.team,
      win: player.win,
      level: player.level,
      kills: player.kills,
      deaths: player.deaths,
      assists: player.assists,
      doubleKills: player.doubleKills,
      tripleKills: player.tripleKills,
      quadraKills: player.quadraKills,
      pentaKills: player.pentaKills,
      goldEarned: player.goldEarned,
      creepScore: player.creepScore,
      magicDamageDealt: player.magicDamageDealt,
      magicDamageToChampions: player.magicDamageToChampions,
      magicDamageTaken: player.magicDamageTaken,
      physicalDamageDealt: player.physicalDamageDealt,
      physicalDamageToChampions: player.physicalDamageToChampions,
      physicalDamageTaken: player.physicalDamageTaken,
      trueDamageDealt: player.trueDamageDealt,
      trueDamageToChampions: player.trueDamageToChampions,
      trueDamageTaken: player.trueDamageTaken,
      totalDamageDealt: player.totalDamageDealt,
      totalDamageToChampions: player.totalDamageToChampions,
      totalDamageTaken: player.totalDamageTaken,
      visionScore: player.visionScore,
      controlWardsBought: player.controlWardsBought,
      wardsKilled: player.wardsKilled,
      wardsPlaced: player.wardsPlaced,
      items: player.items,
      perks: player.perks,
      summonerSpells: player.summonerSpells,
    };
  });
};

// ============================================
// 매치 삭제
// ============================================

/** 매치 삭제 (연관 데이터 포함) */
export const deleteMatch = async (matchId: string) => {
  // 1. 삭제할 데이터 조회
  const playerStats = await PlayerStats.find({ matchId });
  const matchToDelete = await Match.findById(matchId);

  if (!matchToDelete) {
    throw new Error("매치를 찾을 수 없습니다.");
  }

  const affectedPlayerIds = [
    ...new Set(playerStats.map((ps) => ps.playerId.toString())),
  ];

  // 2. 통계 차감 (삭제 전)
  await updateStatisticsOnDelete(
    playerStats.map((ps) => ({
      playerId: ps.playerId,
      champion: ps.champion,
      position: ps.position,
      win: ps.win,
    })),
    matchToDelete.banChampions
  );

  // 3. 데이터 삭제
  await Match.findByIdAndDelete(matchId);
  await PlayerStats.deleteMany({ matchId });

  // 4. 플레이어 최근 통계 재계산
  await Promise.all(affectedPlayerIds.map(updatePlayerRecentStats));

  return { deletedMatchId: matchId, affectedPlayers: affectedPlayerIds.length };
};

// ============================================
// 플레이어 최근 통계
// ============================================

/** 플레이어의 recentStats 재계산 (최근 10경기) */
const updatePlayerRecentStats = async (playerId: string) => {
  const recentGames = await PlayerStats.find({ playerId })
    .sort({ createdAt: -1 })
    .limit(10);

  if (recentGames.length === 0) {
    await Player.findByIdAndUpdate(playerId, {
      recentStats: {
        games: 0,
        wins: 0,
        losses: 0,
        winAvg: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        kdaAvg: 0,
      },
    });
    return;
  }

  const games = recentGames.length;
  const wins = recentGames.filter((g) => g.win).length;
  const losses = games - wins;
  const winAvg = Math.round((wins / games) * 100);

  const totalKills = recentGames.reduce((sum, g) => sum + parseInt(g.kills), 0);
  const totalDeaths = recentGames.reduce(
    (sum, g) => sum + parseInt(g.deaths),
    0
  );
  const totalAssists = recentGames.reduce(
    (sum, g) => sum + parseInt(g.assists),
    0
  );

  const kdaAvg =
    totalDeaths === 0
      ? totalKills + totalAssists
      : Math.round(((totalKills + totalAssists) / totalDeaths) * 100) / 100;

  await Player.findByIdAndUpdate(playerId, {
    recentStats: {
      games,
      wins,
      losses,
      winAvg,
      kills: totalKills,
      deaths: totalDeaths,
      assists: totalAssists,
      kdaAvg,
    },
  });
};

// ============================================
// 전체 통계 업데이트 (저장 시)
// ============================================

/** 매치 저장 시 통계 업데이트 */
const updateStatisticsOnSave = async (
  playerStatsDocs: PlayerStatsDocInput[],
  banChampionIds: mongoose.Types.ObjectId[]
) => {
  // GlobalStats 업데이트
  await GlobalStats.findOneAndUpdate(
    {},
    { $inc: { totalMatches: 1, totalBans: banChampionIds.length } },
    { upsert: true }
  );

  const globalStats = await GlobalStats.findOne();
  const totalMatches = globalStats?.totalMatches || 1;
  const totalBans = globalStats?.totalBans || 1;

  // 챔피언 픽 통계, 밴 통계, 플레이어 랭킹 업데이트
  await Promise.all([
    updateChampionPickStats(playerStatsDocs, totalMatches, "inc"),
    updateChampionBanStats(banChampionIds, totalBans, "inc"),
    updatePlayerRankStats(playerStatsDocs, "inc"),
  ]);
};

// ============================================
// 전체 통계 차감 (삭제 시)
// ============================================

/** 매치 삭제 시 통계 차감 */
const updateStatisticsOnDelete = async (
  playerStats: PlayerStatsDocInput[],
  banChampionIds: mongoose.Types.ObjectId[]
) => {
  // GlobalStats 차감
  await GlobalStats.findOneAndUpdate(
    {},
    { $inc: { totalMatches: -1, totalBans: -banChampionIds.length } }
  );

  const globalStats = await GlobalStats.findOne();
  const totalMatches = Math.max(globalStats?.totalMatches || 1, 1);
  const totalBans = Math.max(globalStats?.totalBans || 1, 1);

  // 챔피언 픽 통계, 밴 통계, 플레이어 랭킹 차감
  await Promise.all([
    updateChampionPickStats(playerStats, totalMatches, "dec"),
    updateChampionBanStats(banChampionIds, totalBans, "dec"),
    updatePlayerRankStats(playerStats, "dec"),
  ]);
};

// ============================================
// 챔피언 통계 업데이트
// ============================================

/** 챔피언 픽 통계 업데이트/차감 */
const updateChampionPickStats = async (
  playerStatsDocs: PlayerStatsDocInput[],
  totalMatches: number,
  mode: "inc" | "dec"
) => {
  const delta = mode === "inc" ? 1 : -1;

  for (const player of playerStatsDocs) {
    const position = player.position as Position;

    // 챔피언 이름 조회
    const championDoc = await Champion.findOne({ championId: player.champion });
    const championName = championDoc?.name || player.champion;

    // ChampionStats 업데이트
    const champStats = await ChampionStats.findOneAndUpdate(
      { championId: player.champion },
      {
        $setOnInsert: { championId: player.champion, championName },
        $inc: {
          totalGames: delta,
          wins: player.win ? delta : 0,
          losses: player.win ? 0 : delta,
          [`byPosition.${position}.games`]: delta,
          [`byPosition.${position}.wins`]: player.win ? delta : 0,
        },
      },
      { upsert: true, new: true }
    );

    // 승률/픽률 재계산
    const posStats = champStats.byPosition[position];
    await ChampionStats.updateOne(
      { championId: player.champion },
      {
        $set: {
          winRate: calcWinRate(champStats.wins, champStats.totalGames),
          pickRate: calcRate(champStats.totalGames, totalMatches),
          [`byPosition.${position}.winRate`]: calcWinRate(
            posStats.wins,
            posStats.games
          ),
        },
      }
    );
  }
};

/** 밴 챔피언 통계 업데이트/차감 */
const updateChampionBanStats = async (
  banChampionIds: mongoose.Types.ObjectId[],
  totalBans: number,
  mode: "inc" | "dec"
) => {
  const delta = mode === "inc" ? 1 : -1;

  for (const banId of banChampionIds) {
    const championDoc = await Champion.findById(banId);
    if (!championDoc) continue;

    const champStats = await ChampionStats.findOneAndUpdate(
      { championId: championDoc.championId },
      {
        $setOnInsert: {
          championId: championDoc.championId,
          championName: championDoc.name,
        },
        $inc: { banCount: delta },
      },
      { upsert: true, new: true }
    );

    await ChampionStats.updateOne(
      { championId: championDoc.championId },
      { $set: { banRate: calcRate(champStats.banCount, totalBans) } }
    );
  }
};

/** 플레이어 랭킹 통계 업데이트/차감 */
const updatePlayerRankStats = async (
  playerStatsDocs: PlayerStatsDocInput[],
  mode: "inc" | "dec"
) => {
  const delta = mode === "inc" ? 1 : -1;

  for (const player of playerStatsDocs) {
    const playerDoc = await Player.findById(player.playerId);
    if (!playerDoc) continue;

    const rankStats = await PlayerRankStats.findOneAndUpdate(
      { playerId: player.playerId },
      {
        $setOnInsert: {
          playerId: player.playerId,
          gameName: playerDoc.gameName,
          tagLine: playerDoc.tagLine,
          realName: playerDoc.realName || "",
        },
        $inc: {
          totalGames: delta,
          wins: player.win ? delta : 0,
          losses: player.win ? 0 : delta,
        },
      },
      { upsert: true, new: true }
    );

    await PlayerRankStats.updateOne(
      { playerId: player.playerId },
      { $set: { winRate: calcWinRate(rankStats.wins, rankStats.totalGames) } }
    );
  }
};

/* -------------------------------------------- */
/*                 플레이어 최근 매치 조회                */
/* -------------------------------------------- */

const DEFAULT_PAGE_SIZE = 5;

export const getRecentMatchesByPlayer = async (
  playerId: string,
  pageIndex: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
) => {
  const { data, totalCount } = await getPlayerRecentStats({
    playerId,
    pageIndex,
    pageSize,
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    totalCount,
    totalPages,
    pageIndex,
    pageSize,
    matches: data,
  };
};
