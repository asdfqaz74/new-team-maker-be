// ============================================
// 요청 DTO
// ============================================

/** AI 팀 매칭 요청 시 플레이어 정보 */
export interface PlayerForMatchingDTO {
  playerId: string;
  gameName: string;
  tagLine: string;
  realName?: string;
  mainPosition: string;
  subPosition: string;
  subPosition2?: string;
  recentWinRate: number; // 최근 5게임 승률 (%)
  recentGames: number; // 최근 게임 수
}

/** AI 팀 매칭 요청 */
export interface TeamMatchRequestDTO {
  players: PlayerForMatchingDTO[];
}

// ============================================
// 응답 DTO
// ============================================

/** 팀 구성 내 플레이어 */
export interface TeamPlayerDTO {
  playerId: string;
  gameName: string;
  tagLine: string;
  realName?: string;
  assignedPosition: string; // AI가 배정한 포지션
  recentWinRate: number;
}

/** 단일 팀 구성 */
export interface TeamCompositionDTO {
  blueTeam: TeamPlayerDTO[];
  redTeam: TeamPlayerDTO[];
  balanceScore: number; // 밸런스 점수 (0-100, 높을수록 균형)
  description: string; // AI의 팀 구성 설명
}

/** AI 팀 매칭 응답 */
export interface TeamMatchResponseDTO {
  proposals: TeamCompositionDTO[]; // 3개의 팀 구성 제안
}
