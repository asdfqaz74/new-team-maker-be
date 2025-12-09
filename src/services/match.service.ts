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
import mongoose from "mongoose";

// 포지션 정렬 순서
const POSITION_ORDER = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

/**
 * 포지션 순서대로 정렬
 */
const sortByPosition = (players: ParsedPlayerStats[]): ParsedPlayerStats[] => {
  return [...players].sort((a, b) => {
    return (
      POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position)
    );
  });
};

/**
 * 파싱된 PlayerStats를 PlayerFullDTO로 변환
 */
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

/**
 * ROFL 파일 파싱 후 프리뷰 DTO로 변환
 */
export const parseAndPreview = (filePath: string): MatchPreviewResponseDTO => {
  const parsed = parseRoflFile(filePath);

  if (!parsed.stats) {
    throw new Error("플레이어 스탯을 찾을 수 없습니다.");
  }

  // 팀별로 분리
  const bluePlayers = parsed.stats.filter((p) => p.team === "BLUE");
  const redPlayers = parsed.stats.filter((p) => p.team === "RED");

  // 포지션 순서대로 정렬
  const sortedBlue = sortByPosition(bluePlayers);
  const sortedRed = sortByPosition(redPlayers);

  // 메타데이터
  const metadata: MatchMetadataDTO = {
    gameLength: parsed.metadata.gameLength,
    gameDuration: parsed.metadata.gameDuration,
    winTeam: parsed.metadata.winTeam,
    playTime: parsed.metadata.playTime,
  };

  // DTO로 변환
  return {
    metadata,
    blueTeam: sortedBlue.map(toPlayerFullDTO),
    redTeam: sortedRed.map(toPlayerFullDTO),
  };
};

/**
 * 매치 저장
 */
export const saveMatch = async (data: SaveMatchRequestDTO) => {
  // 1. Match 저장
  // banChampions에서 _id만 추출하여 ObjectId 배열로 변환
  const banChampionIds =
    data.banChampions?.map((ban) => new mongoose.Types.ObjectId(ban._id)) || [];

  const match = await Match.create({
    metadata: data.metadata,
    playedAt: data.playedAt ? new Date(data.playedAt) : new Date(),
    banChampions: banChampionIds,
  });

  // 2. 모든 playerId로 Player 정보 조회
  const playerIds = data.playerMappings.map((m) => m.playerId);
  const players = await Player.find({ _id: { $in: playerIds } });
  const playerMap = new Map(players.map((p) => [p._id.toString(), p]));

  // 3. 팀 데이터 합치기 (인덱스 포함)
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

  // 4. PlayerStats 문서 배열 생성
  const playerStatsDocs = allPlayers.map((player) => {
    // 매핑에서 playerId 찾기
    const mapping = data.playerMappings.find(
      (m) => m.team === player._team && m.index === player._index
    );

    if (!mapping) {
      throw new Error(`매핑 정보가 없습니다: ${player._team} ${player._index}`);
    }

    // Player DB에서 gameName, tagLine 가져오기
    const playerInfo = playerMap.get(mapping.playerId);
    if (!playerInfo) {
      throw new Error(`플레이어를 찾을 수 없습니다: ${mapping.playerId}`);
    }

    return {
      matchId: match._id,
      playerId: new mongoose.Types.ObjectId(mapping.playerId),

      // Player DB에서 가져온 정보
      riotIdGameName: playerInfo.gameName,
      riotIdTagLine: playerInfo.tagLine,

      // 게임 정보
      champion: player.champion,
      position: player.position,
      team: player.team,
      win: player.win,
      level: player.level,

      // KDA
      kills: player.kills,
      deaths: player.deaths,
      assists: player.assists,

      // 멀티킬
      doubleKills: player.doubleKills,
      tripleKills: player.tripleKills,
      quadraKills: player.quadraKills,
      pentaKills: player.pentaKills,

      // 골드/CS
      goldEarned: player.goldEarned,
      creepScore: player.creepScore,

      // 데미지
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

      // 시야
      visionScore: player.visionScore,
      controlWardsBought: player.controlWardsBought,
      wardsKilled: player.wardsKilled,
      wardsPlaced: player.wardsPlaced,

      // 아이템, 룬, 소환사 주문
      items: player.items,
      perks: player.perks,
      summonerSpells: player.summonerSpells,
    };
  });

  // 5. PlayerStats 일괄 저장
  await PlayerStats.insertMany(playerStatsDocs);

  // 6. 각 플레이어의 recentStats 업데이트 (최근 10경기)
  const uniquePlayerIds = [...new Set(playerIds)];

  for (const playerId of uniquePlayerIds) {
    // 해당 플레이어의 최근 10경기 조회
    const recentGames = await PlayerStats.find({ playerId })
      .sort({ createdAt: -1 })
      .limit(10);

    if (recentGames.length === 0) continue;

    // 통계 계산
    const games = recentGames.length;
    const wins = recentGames.filter((g) => g.win).length;
    const losses = games - wins;
    const winAvg = Math.round((wins / games) * 100); // 승률 %

    const totalKills = recentGames.reduce(
      (sum, g) => sum + parseInt(g.kills),
      0
    );
    const totalDeaths = recentGames.reduce(
      (sum, g) => sum + parseInt(g.deaths),
      0
    );
    const totalAssists = recentGames.reduce(
      (sum, g) => sum + parseInt(g.assists),
      0
    );

    // KDA 평균: (kills + assists) / deaths, deaths가 0이면 perfect KDA
    const kdaAvg =
      totalDeaths === 0
        ? totalKills + totalAssists
        : Math.round(((totalKills + totalAssists) / totalDeaths) * 100) / 100;

    // Player recentStats 업데이트
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
  }

  return { matchId: match._id };
};

/**
 * 플레이어의 recentStats 재계산 (최근 10경기)
 */
const updatePlayerRecentStats = async (playerId: string) => {
  const recentGames = await PlayerStats.find({ playerId })
    .sort({ createdAt: -1 })
    .limit(10);

  // 경기가 없으면 초기화
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

/**
 * 매치 삭제 (연관 데이터 포함)
 */
export const deleteMatch = async (matchId: string) => {
  // 1. 해당 매치의 PlayerStats 조회 (playerId 목록 확보)
  const playerStats = await PlayerStats.find({ matchId });
  const affectedPlayerIds = [
    ...new Set(playerStats.map((ps) => ps.playerId.toString())),
  ];

  // 2. Match 삭제
  const deletedMatch = await Match.findByIdAndDelete(matchId);
  if (!deletedMatch) {
    throw new Error("매치를 찾을 수 없습니다.");
  }

  // 3. 관련 PlayerStats 삭제
  await PlayerStats.deleteMany({ matchId });

  // 4. 영향받은 플레이어들의 recentStats 재계산
  for (const playerId of affectedPlayerIds) {
    await updatePlayerRecentStats(playerId);
  }

  return { deletedMatchId: matchId, affectedPlayers: affectedPlayerIds.length };
};
