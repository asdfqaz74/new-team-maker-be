#!/bin/bash

# 매주 수요일 패치 자동화 스크립트
# DDragon 최신 버전 확인 -> 챔피언 데이터 업데이트

echo "=========================================="
echo "DDragon 주간 업데이트 시작"
echo "시작 시간: $(date)"
echo "=========================================="

# 프로젝트 디렉토리로 이동
cd "$(dirname "$0")/.." || exit 1

# Node 버전 설정 (nvm 사용 시)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 24

# 1. 최신 버전 확인 및 저장
echo ""
echo "🔍 Step 1: 최신 버전 확인 중..."
npx tsx scripts/getLatestVersion.ts
VERSION_EXIT_CODE=$?

if [ $VERSION_EXIT_CODE -ne 0 ]; then
  echo "❌ 버전 확인 실패 (Exit code: $VERSION_EXIT_CODE)"
  exit 1
fi

# 2. 챔피언 데이터 업데이트
echo ""
echo "🔍 Step 2: 챔피언 데이터 업데이트 중..."
npx tsx scripts/updateChampions.ts
CHAMPION_EXIT_CODE=$?

if [ $CHAMPION_EXIT_CODE -ne 0 ]; then
  echo "❌ 챔피언 업데이트 실패 (Exit code: $CHAMPION_EXIT_CODE)"
  exit 1
fi

echo ""
echo "=========================================="
echo "✅ 모든 업데이트 완료!"
echo "종료 시간: $(date)"
echo "=========================================="
