import openai from "@/config/openai";
import Player from "@/models/player.model";
import {
  PlayerForMatchingDTO,
  TeamMatchResponseDTO,
  TeamCompositionDTO,
} from "@/dto/team-match.dto";

// ============================================
// 플레이어 데이터 조회
// ============================================

/** 선택된 플레이어들의 매칭용 데이터 조회 */
export const getPlayersForMatching = async (
  playerIds: string[]
): Promise<PlayerForMatchingDTO[]> => {
  const players = await Player.find({ _id: { $in: playerIds } });

  return players.map((player) => ({
    playerId: player._id.toString(),
    gameName: player.gameName,
    tagLine: player.tagLine,
    realName: player.realName,
    mainPosition: player.mainPosition,
    subPosition: player.subPosition,
    subPosition2: player.subPosition2,
    recentWinRate: player.recentStats?.winAvg || 0,
    recentGames: player.recentStats?.games || 0,
  }));
};

// ============================================
// AI 팀 매칭
// ============================================

/** AI를 이용한 팀 매칭 */
export const generateTeamMatching = async (
  players: PlayerForMatchingDTO[],
  positionCheck: boolean
): Promise<TeamMatchResponseDTO> => {
  if (players.length !== 10) {
    throw new Error("팀 매칭을 위해서는 정확히 10명의 플레이어가 필요합니다.");
  }

  const prompt = buildPrompt(players, positionCheck);

  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    messages: [
      {
        role: "system",
        content: `당신은 리그오브레전드 5대5 팀 매칭 전문가입니다.
주어진 10명의 플레이어 정보를 바탕으로 공정하고 균형 잡힌 팀을 구성합니다.

**중요 규칙:**
1. 각 팀은 정확히 5명으로 구성됩니다.
2. **절대로 같은 플레이어를 중복 배치하면 안 됩니다. 각 플레이어는 블루팀 또는 레드팀 중 한 곳에만 배치되어야 합니다.**
3. 10명의 플레이어를 5명씩 두 팀으로 나눕니다. 모든 플레이어가 반드시 한 번씩만 배치되어야 합니다.
4. 각 팀에는 TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY 포지션이 하나씩 있어야 합니다.
5. 플레이어의 주 포지션(mainPosition)을 우선 배정하고, 불가능하면 부 포지션(subPosition, subPosition2)을 고려합니다.
5-1. 만약 positionCheck가 false로 설정되어 있다면, 포지션 제약 없이 팀을 구성할 수 있습니다.
6. 양 팀의 평균 승률이 비슷하도록 균형을 맞춥니다.
7. 반드시 3가지 다른 팀 구성을 제안합니다.

응답은 반드시 아래 JSON 형식으로만 출력하세요. 다른 텍스트는 포함하지 마세요.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("AI 응답이 비어있습니다.");
  }

  const parsed = JSON.parse(content);

  // 중복 플레이어 검증
  validateNoPlayerDuplicates(parsed);

  return transformAIResponse(parsed, players, positionCheck);
};

/** 플레이어 중복 검증 */
const validateNoPlayerDuplicates = (aiResponse: any) => {
  for (const proposal of aiResponse.proposals) {
    const allPlayerIds = [
      ...proposal.blueTeam.map((p: any) => p.playerId),
      ...proposal.redTeam.map((p: any) => p.playerId),
    ];

    const uniqueIds = new Set(allPlayerIds);
    if (uniqueIds.size !== 10) {
      throw new Error(
        "AI가 중복된 플레이어를 배치했습니다. 다시 시도해주세요."
      );
    }
  }
};

// ============================================
// 프롬프트 생성
// ============================================

/** AI에게 보낼 프롬프트 생성 */
const buildPrompt = (
  players: PlayerForMatchingDTO[],
  positionCheck: boolean
): string => {
  const playerList = players
    .map(
      (p, idx) =>
        `${idx + 1}. ${p.gameName}#${p.tagLine}${
          p.realName ? ` (${p.realName})` : ""
        }
   - ID: ${p.playerId}
   - 주 포지션: ${p.mainPosition}
   - 부 포지션: ${p.subPosition}${p.subPosition2 ? `, ${p.subPosition2}` : ""}
   - 최근 ${p.recentGames}게임 승률: ${p.recentWinRate}%`
    )
    .join("\n");

  return `다음 10명의 플레이어로 균형 잡힌 5대5 팀을 3가지 구성해주세요. 플레이어는 중복되어서는 안됩니다.

플레이어 목록:
${playerList}

positionCheck: ${positionCheck} (true: 주포지션, 부포지션을 반드시 고려해야함 / false: 포지션 제약 없음)

응답 형식 (JSON):
positionCheck 가 true 인 경우:
{
  "proposals": [
    {
      "blueTeam": [
        { "playerId": "...", "recommendPosition": "TOP" },
        { "playerId": "...", "recommendPosition": "JUNGLE" },
        { "playerId": "...", "recommendPosition": "MIDDLE" },
        { "playerId": "...", "recommendPosition": "BOTTOM" },
        { "playerId": "...", "recommendPosition": "UTILITY" }
      ],
      "redTeam": [
        { "playerId": "...", "recommendPosition": "TOP" },
        { "playerId": "...", "recommendPosition": "JUNGLE" },
        { "playerId": "...", "recommendPosition": "MIDDLE" },
        { "playerId": "...", "recommendPosition": "BOTTOM" },
        { "playerId": "...", "recommendPosition": "UTILITY" }
      ],
      "balanceScore": 85,
      "description": "이 구성의 특징 설명...",
      "predictedWinner": "BLUE",
      "predictedWinRate": 55
    }
  ]
}

positionCheck 가 false 인 경우:
{
  "proposals": [
    {
        "blueTeam": [
        { "playerId": "..." },
        { "playerId": "..." },
        { "playerId": "..." },
        { "playerId": "..." },
        { "playerId": "..." }
      ],
        "redTeam": [
        { "playerId": "..." },
        { "playerId": "..." },
        { "playerId": "..." },
        { "playerId": "..." },
        { "playerId": "..." }
        ],
        "balanceScore": 90,
        "description": "이 구성의 특징 설명..."
        "predictedWinner": "BLUE" // 또는 "RED"
        "predictedWinRate": 75 // 승리 확률 (%)
    }
  ]
}
`;
};

// ============================================
// AI 응답 변환
// ============================================

/** AI 응답을 DTO 형식으로 변환 */
const transformAIResponse = (
  aiResponse: any,
  players: PlayerForMatchingDTO[],
  positionCheck: boolean
): TeamMatchResponseDTO => {
  const playerMap = new Map(players.map((p) => [p.playerId, p]));

  const proposals: TeamCompositionDTO[] = aiResponse.proposals.map(
    (proposal: any) => ({
      blueTeam: proposal.blueTeam.map((p: any) => {
        const player = playerMap.get(p.playerId);
        return {
          playerId: p.playerId,
          gameName: player?.gameName || "",
          tagLine: player?.tagLine || "",
          realName: player?.realName,
          assignedPosition: p.recommendPosition || null, // AI는 recommendPosition으로 응답
          recentWinRate: player?.recentWinRate || 0,
        };
      }),
      redTeam: proposal.redTeam.map((p: any) => {
        const player = playerMap.get(p.playerId);
        return {
          playerId: p.playerId,
          gameName: player?.gameName || "",
          tagLine: player?.tagLine || "",
          realName: player?.realName,
          assignedPosition: p.recommendPosition || null, // AI는 recommendPosition으로 응답
          recentWinRate: player?.recentWinRate || 0,
        };
      }),
      balanceScore: proposal.balanceScore,
      description: proposal.description,
      positionCheck,
      predictedWinner: proposal.predictedWinner,
      predictedWinRate: proposal.predictedWinRate,
    })
  );

  return { proposals };
};
