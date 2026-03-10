#!/bin/bash

# 253 서버로 배포 스크립트
# 사용법: ./deploy-to-253.sh

set -e

# 설정
TARGET_HOST="253"
TARGET_USER="ops"
TARGET_DIR="/opt/gogs-knowledge-engine"
GIT_REPO="https://gogs.dclub.kr/kim/gogs-knowledge-engine.git"
COMMIT="b19cfa9"

# 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 로깅 함수
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

# 1. 사전 검증
log_info "=== 배포 사전 검증 ==="
log_info "로컬 테스트 실행..."
cd /data/data/com.termux/files/home/gogs-chatbot/8.0-production-hardening
node tests/test-hardening.js > /tmp/test-results.log 2>&1 || log_error "로컬 테스트 실패"
log_info "✓ 로컬 테스트 통과"

# 2. 253 서버 연결 확인
log_info "=== 253 서버 연결 확인 ==="
ping -c 1 ${TARGET_HOST} > /dev/null 2>&1 || log_error "253 서버에 연결할 수 없습니다"
log_info "✓ 253 서버에 연결되었습니다"

# 3. SSH 접속 테스트
log_info "=== SSH 연결 테스트 ==="
ssh -o ConnectTimeout=5 ${TARGET_USER}@${TARGET_HOST} "echo 'SSH OK'" > /dev/null 2>&1 || log_error "SSH 연결 실패"
log_info "✓ SSH 연결 성공"

# 4. 배포 디렉토리 준비
log_info "=== 배포 디렉토리 준비 ==="
ssh ${TARGET_USER}@${TARGET_HOST} "mkdir -p ${TARGET_DIR}" || log_error "디렉토리 생성 실패"
log_info "✓ 디렉토리 생성 완료"

# 5. 저장소 복제/업데이트
log_info "=== 저장소 복제/업데이트 ==="
ssh ${TARGET_USER}@${TARGET_HOST} << 'EOF'
  set -e
  if [ -d "/opt/gogs-knowledge-engine/.git" ]; then
    cd /opt/gogs-knowledge-engine
    git fetch origin
    git checkout master
    git pull origin master
  else
    cd /opt
    git clone https://gogs.dclub.kr/kim/gogs-knowledge-engine.git
    cd gogs-knowledge-engine
    git checkout master
  fi
EOF

if [ $? -eq 0 ]; then
  log_info "✓ 저장소 준비 완료"
else
  log_error "저장소 준비 실패"
fi

# 6. 환경 파일 설정
log_info "=== 환경 파일 설정 ==="
ssh ${TARGET_USER}@${TARGET_HOST} << 'EOF'
  set -e
  cd /opt/gogs-knowledge-engine

  # .env 파일 존재 확인
  if [ ! -f "8.0-production-hardening/.env" ]; then
    log_info "Creating .env file from template..."
    cp 8.0-production-hardening/.env.example 8.0-production-hardening/.env
    log_warn "⚠️  .env 파일을 수정하세요: /opt/gogs-knowledge-engine/8.0-production-hardening/.env"
  fi

  # 로그 디렉토리 생성
  mkdir -p /var/log/gogs-knowledge-engine
  mkdir -p /var/log/gogs-audit
  chmod 755 /var/log/gogs-knowledge-engine
  chmod 755 /var/log/gogs-audit
EOF

log_info "✓ 환경 파일 설정 완료"

# 7. 원격 테스트 실행
log_info "=== 원격 테스트 실행 ==="
ssh ${TARGET_USER}@${TARGET_HOST} << 'EOF'
  set -e
  cd /opt/gogs-knowledge-engine/8.0-production-hardening
  node tests/test-hardening.js > /tmp/remote-test-results.log 2>&1
EOF

if [ $? -eq 0 ]; then
  log_info "✓ 원격 테스트 통과"
else
  log_error "원격 테스트 실패"
fi

# 8. 배포 완료
log_info "=== 배포 완료 ==="
log_info "✅ 253 서버에 배포가 완료되었습니다"
log_info ""
log_info "배포된 버전: b19cfa9 (8.0 운영 안정화)"
log_info "배포 위치: /opt/gogs-knowledge-engine"
log_info ""
log_info "다음 단계:"
log_info "1. 253 서버에 SSH로 접속"
log_info "2. .env 파일 수정: /opt/gogs-knowledge-engine/8.0-production-hardening/.env"
log_info "3. 헬스 체크 실행"
log_info "4. 모니터링 활성화"
log_info ""
log_info "롤백 방법 (필요시):"
log_info "cd /opt/gogs-knowledge-engine && git checkout master~1"
log_info ""
log_info "배포 시간: $(date '+%Y-%m-%d %H:%M:%S')"

exit 0
