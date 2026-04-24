-- =============================================================================
-- 디퐁 메신저 데이터베이스 스키마 v2
-- MySQL 8.0 / InnoDB / utf8mb4_0900_ai_ci
-- =============================================================================
-- 작성일: 2026-04-24
-- 작성자: Oscar
-- 버전: v2.0 (저장소 분리 반영)
-- =============================================================================
-- 주요 변경점 (v1 대비)
--   - 제거: NOTIFICATION_QUEUE_ITEM (BullMQ에 위임)
--   - 제거: URGENT_QUOTA (Redis 전용: urgent:quota:{USER_ID}:{YYYYMMDD}, TTL 48h)
--   - 제거: CATCHUP_FEED_CACHE (Redis 전용: feed:{USER_ID}, TTL 1h)
--   - 축소: PRESENCE (Redis 주 저장소, DB는 마지막 세션 기록용)
--   - 분리: MESSAGE.CONTENT FULLTEXT 인덱스 제거 (Meilisearch가 담당)
--   - 파티션: MESSAGE 월별 RANGE 파티션 (오래된 파티션은 S3 아카이브)
--   - 보강: ARCHIVED 플래그로 콜드 스토리지 이동 상태 추적
-- =============================================================================
-- 저장소 매트릭스
--   MySQL (이 스키마)        : 관계형·영구 보관·무결성 중요
--   Redis                    : 프레즌스·쿼터·SEQ 발급·타이핑·읽음 상태·피드 캐시
--   BullMQ (Redis 기반)      : 알림 지연·배치 스케줄링
--   S3 / R2                  : 이미지·첨부·오래된 메시지 Parquet 아카이브
--   Meilisearch              : 메시지 본문 검색
--   ClickHouse (Phase 4+)    : NOTIFICATION 분석·FEED_ACTION·지표 집계
-- =============================================================================
-- 네이밍 규칙
--   - 테이블명: 단수형, 대문자 스네이크케이스
--   - 컬럼명: 대문자 스네이크케이스
--   - PK: ID (BIGINT UNSIGNED AUTO_INCREMENT)
--   - FK: {대상테이블}_ID
--   - 타임스탬프: CREATED_AT, UPDATED_AT (UTC 저장)
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- 1. USER (사용자 계정)
-- 담당: 팀 A | 관련 기능: A1, A2, A3
-- =============================================================================
CREATE TABLE IF NOT EXISTS `USER` (
    `ID`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '사용자 PK',
    `EMAIL`             VARCHAR(255)    NOT NULL                COMMENT '이메일 주소 (로그인 ID로 사용)',
    `PASSWORD_HASH`     VARCHAR(255)    NULL                    COMMENT 'bcrypt 해시값, OAuth 전용 계정은 NULL',
    `NICKNAME`          VARCHAR(50)     NOT NULL                COMMENT '닉네임 (친구에게 표시되는 이름)',
    `HANDLE`            VARCHAR(50)     NOT NULL                COMMENT '고유 핸들 (예: oscar#7k3n), 검색용',
    `BIO`               VARCHAR(200)    NULL                    COMMENT '한 줄 소개',
    `AVATAR_URL`        VARCHAR(500)    NULL                    COMMENT '프로필 이미지 URL (S3/R2)',
    `TIMEZONE`          VARCHAR(50)     NOT NULL DEFAULT 'Asia/Seoul' COMMENT 'IANA 타임존',
    `LOCALE`            VARCHAR(10)     NOT NULL DEFAULT 'ko-KR' COMMENT '언어/지역 코드',
    `EMAIL_VERIFIED_AT` DATETIME        NULL                    COMMENT '이메일 인증 완료 시각',
    `LAST_SEEN_AT`      DATETIME        NULL                    COMMENT '마지막 활동 시각 (Redis에서 주기 플러시)',
    `DELETED_AT`        DATETIME        NULL                    COMMENT '소프트 삭제 시각 (7일 유예)',
    `CREATED_AT`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '가입 일시',
    `UPDATED_AT`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시',
    PRIMARY KEY (`ID`),
    UNIQUE KEY `UK_USER_EMAIL` (`EMAIL`),
    UNIQUE KEY `UK_USER_HANDLE` (`HANDLE`),
    KEY `IDX_USER_DELETED_AT` (`DELETED_AT`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='사용자 계정 정보';


-- =============================================================================
-- 2. USER_OAUTH (OAuth 로그인 연결)
-- 담당: 팀 A | 관련 기능: A2
-- =============================================================================
CREATE TABLE IF NOT EXISTS `USER_OAUTH` (
    `ID`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
    `USER_ID`          BIGINT UNSIGNED NOT NULL                COMMENT '연결된 사용자 ID',
    `PROVIDER`         VARCHAR(20)     NOT NULL                COMMENT 'OAuth 제공자: kakao / google',
    `PROVIDER_USER_ID` VARCHAR(255)    NOT NULL                COMMENT '제공자 측 고유 ID (sub)',
    `PROVIDER_EMAIL`   VARCHAR(255)    NULL                    COMMENT '제공자가 준 이메일',
    `CONNECTED_AT`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '연결 일시',
    PRIMARY KEY (`ID`),
    UNIQUE KEY `UK_USER_OAUTH_PROVIDER` (`PROVIDER`, `PROVIDER_USER_ID`),
    KEY `IDX_USER_OAUTH_USER_ID` (`USER_ID`),
    CONSTRAINT `FK_USER_OAUTH_USER`
        FOREIGN KEY (`USER_ID`) REFERENCES `USER`(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='OAuth 로그인 연결 정보 (유저 1명당 N개 제공자 가능)';


-- =============================================================================
-- 3. REFRESH_TOKEN (JWT refresh 토큰)
-- 담당: 팀 A | 관련 기능: A1, A13
-- 주의: access 토큰은 Redis, 여기는 refresh만
-- =============================================================================
CREATE TABLE IF NOT EXISTS `REFRESH_TOKEN` (
    `ID`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
    `USER_ID`     BIGINT UNSIGNED NOT NULL                COMMENT '사용자 ID',
    `TOKEN_HASH`  VARCHAR(255)    NOT NULL                COMMENT 'refresh 토큰 해시 (SHA-256)',
    `DEVICE_INFO` VARCHAR(255)    NULL                    COMMENT '디바이스 식별 정보',
    `IP_ADDRESS`  VARCHAR(45)     NULL                    COMMENT '발급 시 IP',
    `EXPIRES_AT`  DATETIME        NOT NULL                COMMENT '만료 일시',
    `REVOKED_AT`  DATETIME        NULL                    COMMENT '철회 일시',
    `CREATED_AT`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발급 일시',
    PRIMARY KEY (`ID`),
    UNIQUE KEY `UK_REFRESH_TOKEN_HASH` (`TOKEN_HASH`),
    KEY `IDX_REFRESH_TOKEN_USER_EXPIRES` (`USER_ID`, `EXPIRES_AT`),
    CONSTRAINT `FK_REFRESH_TOKEN_USER`
        FOREIGN KEY (`USER_ID`) REFERENCES `USER`(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='JWT refresh 토큰 저장소 (access 토큰은 Redis)';


-- =============================================================================
-- 4. WORKSPACE (업무 시간 프로필)
-- 담당: 팀 A | 관련 기능: A4, A10, A12
-- =============================================================================
CREATE TABLE IF NOT EXISTS `WORKSPACE` (
    `USER_ID`         BIGINT UNSIGNED NOT NULL                COMMENT '사용자 ID (PK 겸용)',
    `WORK_DAYS`       VARCHAR(20)     NOT NULL DEFAULT '1,2,3,4,5' COMMENT '업무 요일 (0=일,1=월...6=토)',
    `WORK_START_TIME` TIME            NOT NULL DEFAULT '09:30:00' COMMENT '업무 시작 시각',
    `WORK_END_TIME`   TIME            NOT NULL DEFAULT '18:30:00' COMMENT '업무 종료 시각',
    `LUNCH_BREAK`     BOOLEAN         NOT NULL DEFAULT TRUE   COMMENT '점심시간 예외 적용',
    `SHARE_WORKTIME`  BOOLEAN         NOT NULL DEFAULT TRUE   COMMENT '친구에게 공개 (기본값)',
    `UPDATED_AT`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시',
    PRIMARY KEY (`USER_ID`),
    CONSTRAINT `FK_WORKSPACE_USER`
        FOREIGN KEY (`USER_ID`) REFERENCES `USER`(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='사용자 업무 시간 프로필 (프레즌스 자동 전환 기준)';


-- =============================================================================
-- 5. INVITE_TOKEN (친구 초대 토큰)
-- 담당: 팀 A | 관련 기능: A5
-- =============================================================================
CREATE TABLE IF NOT EXISTS `INVITE_TOKEN` (
    `ID`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
    `TOKEN`          VARCHAR(64)     NOT NULL                COMMENT '초대 토큰 (URL-safe)',
    `ISSUER_USER_ID` BIGINT UNSIGNED NOT NULL                COMMENT '발급자 사용자 ID',
    `SINGLE_USE`     BOOLEAN         NOT NULL DEFAULT TRUE   COMMENT '1회용 여부',
    `MAX_USE_COUNT`  INT UNSIGNED    NOT NULL DEFAULT 1      COMMENT '최대 사용 횟수',
    `USED_COUNT`     INT UNSIGNED    NOT NULL DEFAULT 0      COMMENT '현재 사용 횟수',
    `EXPIRES_AT`     DATETIME        NOT NULL                COMMENT '만료 일시 (24h 기본)',
    `CREATED_AT`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발급 일시',
    PRIMARY KEY (`ID`),
    UNIQUE KEY `UK_INVITE_TOKEN` (`TOKEN`),
    KEY `IDX_INVITE_ISSUER` (`ISSUER_USER_ID`),
    KEY `IDX_INVITE_EXPIRES` (`EXPIRES_AT`),
    CONSTRAINT `FK_INVITE_TOKEN_USER`
        FOREIGN KEY (`ISSUER_USER_ID`) REFERENCES `USER`(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='친구 초대 링크 토큰 (만료된 토큰은 cron으로 주기 정리)';


-- =============================================================================
-- 6. FRIENDSHIP (친구 관계)
-- 담당: 팀 A | 관련 기능: A8
-- =============================================================================
CREATE TABLE IF NOT EXISTS `FRIENDSHIP` (
    `ID`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
    `REQUESTER_USER_ID` BIGINT UNSIGNED NOT NULL                COMMENT '친구 요청을 보낸 사용자 ID',
    `ADDRESSEE_USER_ID` BIGINT UNSIGNED NOT NULL                COMMENT '친구 요청을 받은 사용자 ID',
    `STATUS`            ENUM('PENDING','ACCEPTED','BLOCKED','REMOVED') NOT NULL DEFAULT 'PENDING'
                                                                COMMENT '관계 상태',
    `INVITE_SOURCE`     ENUM('LINK','EMAIL','QR','MANUAL')      NULL COMMENT '추가 경로',
    `ACCEPTED_AT`       DATETIME        NULL                    COMMENT '수락 일시',
    `BLOCKED_AT`        DATETIME        NULL                    COMMENT '차단 일시',
    `CREATED_AT`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '요청 일시',
    `UPDATED_AT`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시',
    PRIMARY KEY (`ID`),
    UNIQUE KEY `UK_FRIENDSHIP_PAIR` (`REQUESTER_USER_ID`, `ADDRESSEE_USER_ID`),
    KEY `IDX_FRIENDSHIP_ADDRESSEE` (`ADDRESSEE_USER_ID`, `STATUS`),
    KEY `IDX_FRIENDSHIP_REQUESTER` (`REQUESTER_USER_ID`, `STATUS`),
    CONSTRAINT `FK_FRIENDSHIP_REQUESTER`
        FOREIGN KEY (`REQUESTER_USER_ID`) REFERENCES `USER`(`ID`) ON DELETE CASCADE,
    CONSTRAINT `FK_FRIENDSHIP_ADDRESSEE`
        FOREIGN KEY (`ADDRESSEE_USER_ID`) REFERENCES `USER`(`ID`) ON DELETE CASCADE,
    CONSTRAINT `CK_FRIENDSHIP_NOT_SELF`
        CHECK (`REQUESTER_USER_ID` <> `ADDRESSEE_USER_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='친구 관계 (양방향 수락 기반)';


-- =============================================================================
-- 7. COMMUNICATION_NORM (친구별 커뮤니케이션 규범)
-- 담당: 팀 A | 관련 기능: A9, A11 ★ 차별 기능
-- =============================================================================
CREATE TABLE IF NOT EXISTS `COMMUNICATION_NORM` (
    `ID`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
    `OWNER_USER_ID`      BIGINT UNSIGNED NOT NULL                COMMENT '이 규범을 소유한 사용자 ID',
    `FRIEND_USER_ID`     BIGINT UNSIGNED NOT NULL                COMMENT '규범의 대상 친구 ID',
    `DEFAULT_TONE`       ENUM('CHAT','ASK','URGENT','SHARE') NOT NULL DEFAULT 'CHAT'
                                                                 COMMENT '기본 메시지 톤',
    `ALLOW_URGENT`       BOOLEAN         NOT NULL DEFAULT TRUE   COMMENT '상대방 급함 태그 허용',
    `SHARE_READ_RECEIPT` BOOLEAN         NOT NULL DEFAULT TRUE   COMMENT '읽음 표시 공유',
    `SHARE_PRESENCE`     BOOLEAN         NOT NULL DEFAULT TRUE   COMMENT '프레즌스 공유',
    `SHARE_WORKTIME`     BOOLEAN         NOT NULL DEFAULT TRUE   COMMENT '업무시간 공유',
    `FEED_PRIORITY`      ENUM('LOW','NORMAL','HIGH') NOT NULL DEFAULT 'NORMAL'
                                                                 COMMENT '따라잡기 피드 우선순위',
    `NICKNAME_MEMO`      VARCHAR(100)    NULL                    COMMENT '개인 메모 (별명·관계 메모)',
    `MUTED`              BOOLEAN         NOT NULL DEFAULT FALSE  COMMENT '음소거',
    `CREATED_AT`         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
    `UPDATED_AT`         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시',
    PRIMARY KEY (`ID`),
    UNIQUE KEY `UK_COMM_NORM_PAIR` (`OWNER_USER_ID`, `FRIEND_USER_ID`),
    KEY `IDX_COMM_NORM_FRIEND` (`FRIEND_USER_ID`),
    CONSTRAINT `FK_COMM_NORM_OWNER`
        FOREIGN KEY (`OWNER_USER_ID`) REFERENCES `USER`(`ID`) ON DELETE CASCADE,
    CONSTRAINT `FK_COMM_NORM_FRIEND`
        FOREIGN KEY (`FRIEND_USER_ID`) REFERENCES `USER`(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='친구별 커뮤니케이션 규범 (양쪽 비대칭 설정, 자주 읽힘 → Redis 캐싱 대상)';


-- =============================================================================
-- 8. ROOM (대화방)
-- 담당: 팀 B | 관련 기능: B1, B7
-- =============================================================================
CREATE TABLE IF NOT EXISTS `ROOM` (
    `ID`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
    `TYPE`            ENUM('DIRECT','GROUP') NOT NULL         COMMENT '방 유형',
    `NAME`            VARCHAR(100)    NULL                    COMMENT '방 이름 (그룹만)',
    `DEFAULT_TONE`    ENUM('CHAT','ASK','URGENT','SHARE') NOT NULL DEFAULT 'CHAT' COMMENT '방 기본 톤',
    `CREATED_BY`      BIGINT UNSIGNED NOT NULL                COMMENT '생성자 ID',
    `LAST_MESSAGE_AT` DATETIME        NULL                    COMMENT '마지막 메시지 일시',
    `CREATED_AT`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
    `UPDATED_AT`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시',
    PRIMARY KEY (`ID`),
    KEY `IDX_ROOM_TYPE` (`TYPE`),
    KEY `IDX_ROOM_CREATED_BY` (`CREATED_BY`),
    KEY `IDX_ROOM_LAST_MESSAGE` (`LAST_MESSAGE_AT`),
    CONSTRAINT `FK_ROOM_CREATOR`
        FOREIGN KEY (`CREATED_BY`) REFERENCES `USER`(`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='대화방 (1:1 또는 그룹)';


-- =============================================================================
-- 9. ROOM_MEMBER (방 멤버십)
-- 담당: 팀 B | 관련 기능: B1, B7
-- =============================================================================
CREATE TABLE IF NOT EXISTS `ROOM_MEMBER` (
    `ID`        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
    `ROOM_ID`   BIGINT UNSIGNED NOT NULL                COMMENT '방 ID',
    `USER_ID`   BIGINT UNSIGNED NOT NULL                COMMENT '사용자 ID',
    `ROLE`      ENUM('ADMIN','MEMBER') NOT NULL DEFAULT 'MEMBER' COMMENT '역할',
    `JOINED_AT` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '입장 일시',
    `LEFT_AT`   DATETIME        NULL                    COMMENT '퇴장 일시',
    PRIMARY KEY (`ID`),
    UNIQUE KEY `UK_ROOM_MEMBER` (`ROOM_ID`, `USER_ID`),
    KEY `IDX_ROOM_MEMBER_USER` (`USER_ID`, `LEFT_AT`),
    CONSTRAINT `FK_ROOM_MEMBER_ROOM`
        FOREIGN KEY (`ROOM_ID`) REFERENCES `ROOM`(`ID`) ON DELETE CASCADE,
    CONSTRAINT `FK_ROOM_MEMBER_USER`
        FOREIGN KEY (`USER_ID`) REFERENCES `USER`(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='방 멤버십 (방당 2~50명)';


-- =============================================================================
-- 10. MESSAGE (메시지) - 핫 데이터 (최근 90일)
-- 담당: 팀 B | 관련 기능: B2, B3, B6, B10, B12, B13 ★ 톤 태그
-- =============================================================================
-- 저장소 분리
--   SEQ 발급       → Redis INCR (key: room:seq:{ROOM_ID})
--   본문 검색      → Meilisearch (비동기 sync)
--   90일 초과      → S3 Parquet 아카이브, ARCHIVED=TRUE 마킹
--   파티셔닝      → CREATED_AT 기준 월별 RANGE 파티션
-- =============================================================================
CREATE TABLE IF NOT EXISTS `MESSAGE` (
    `ID`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
    `ROOM_ID`           BIGINT UNSIGNED NOT NULL                COMMENT '방 ID',
    `SENDER_USER_ID`    BIGINT UNSIGNED NOT NULL                COMMENT '발신자 사용자 ID',
    `SEQ`               BIGINT UNSIGNED NOT NULL                COMMENT '방 내 순번 (Redis INCR 발급)',
    `CLIENT_MESSAGE_ID` VARCHAR(64)     NOT NULL                COMMENT '클라이언트 UUID (멱등성)',
    `TONE`              ENUM('CHAT','ASK','URGENT','SHARE') NOT NULL COMMENT '메시지 톤 태그',
    `CONTENT_TYPE`      ENUM('TEXT','IMAGE','LINK','MIXED')  NOT NULL DEFAULT 'TEXT' COMMENT '콘텐츠 유형',
    `CONTENT`           TEXT            NOT NULL                COMMENT '메시지 본문 (검색은 Meilisearch)',
    `ATTACHMENT_JSON`   JSON            NULL                    COMMENT '첨부 메타 (이미지 URL은 S3/R2 경로)',
    `REPLY_TO_MSG_ID`   BIGINT UNSIGNED NULL                    COMMENT '답장 대상 메시지 ID',
    `VERSION`           INT UNSIGNED    NOT NULL DEFAULT 1      COMMENT '낙관적 동시성 버전',
    `ARCHIVED`          BOOLEAN         NOT NULL DEFAULT FALSE  COMMENT 'S3 아카이브 완료 여부',
    `EDITED_AT`         DATETIME        NULL                    COMMENT '최종 편집 일시',
    `DELETED_AT`        DATETIME        NULL                    COMMENT '삭제 일시 (소프트 삭제)',
    `CREATED_AT`        DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '전송 일시 (ms 단위)',
    PRIMARY KEY (`ID`, `CREATED_AT`),
    UNIQUE KEY `UK_MESSAGE_ROOM_SEQ` (`ROOM_ID`, `SEQ`, `CREATED_AT`),
    UNIQUE KEY `UK_MESSAGE_CLIENT_ID` (`CLIENT_MESSAGE_ID`, `CREATED_AT`),
    KEY `IDX_MESSAGE_SENDER` (`SENDER_USER_ID`, `CREATED_AT`),
    KEY `IDX_MESSAGE_ROOM_CREATED` (`ROOM_ID`, `CREATED_AT`),
    KEY `IDX_MESSAGE_ARCHIVED` (`ARCHIVED`, `CREATED_AT`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='메시지 (핫: 최근 90일, 콜드: S3 Parquet. 본문 검색은 Meilisearch)'
  PARTITION BY RANGE (TO_DAYS(`CREATED_AT`)) (
    PARTITION p2026_04 VALUES LESS THAN (TO_DAYS('2026-05-01')),
    PARTITION p2026_05 VALUES LESS THAN (TO_DAYS('2026-06-01')),
    PARTITION p2026_06 VALUES LESS THAN (TO_DAYS('2026-07-01')),
    PARTITION p2026_07 VALUES LESS THAN (TO_DAYS('2026-08-01')),
    PARTITION p2026_08 VALUES LESS THAN (TO_DAYS('2026-09-01')),
    PARTITION p2026_09 VALUES LESS THAN (TO_DAYS('2026-10-01')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
  );
-- 주의: 외래키는 파티션 테이블과 충돌하므로 제거
-- 참조 무결성은 애플리케이션 레이어에서 보장 (Prisma validator)
-- 운영 시 매월 cron으로 다음달 파티션 ADD, 3달 지난 파티션은 DROP (S3 아카이브 후)


-- =============================================================================
-- 11. MESSAGE_READ (읽음 표시 · 최종 상태만)
-- 담당: 팀 B | 관련 기능: B9
-- 저장소: 실시간 업데이트는 Redis (read:{ROOM_ID}:{USER_ID}), 30초마다 DB 플러시
-- =============================================================================
CREATE TABLE IF NOT EXISTS `MESSAGE_READ` (
    `ROOM_ID`       BIGINT UNSIGNED NOT NULL                COMMENT '방 ID',
    `USER_ID`       BIGINT UNSIGNED NOT NULL                COMMENT '사용자 ID',
    `LAST_READ_SEQ` BIGINT UNSIGNED NOT NULL DEFAULT 0      COMMENT '마지막 읽은 SEQ',
    `UPDATED_AT`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 플러시 일시',
    PRIMARY KEY (`ROOM_ID`, `USER_ID`),
    KEY `IDX_MESSAGE_READ_USER` (`USER_ID`),
    CONSTRAINT `FK_MESSAGE_READ_ROOM`
        FOREIGN KEY (`ROOM_ID`) REFERENCES `ROOM`(`ID`) ON DELETE CASCADE,
    CONSTRAINT `FK_MESSAGE_READ_USER`
        FOREIGN KEY (`USER_ID`) REFERENCES `USER`(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='방별·유저별 읽음 상태 (Redis에서 주기적으로 플러시)';


-- =============================================================================
-- 12. MESSAGE_REACTION (메시지 이모지 반응)
-- 담당: 팀 B | 관련 기능: B18
-- =============================================================================
CREATE TABLE IF NOT EXISTS `MESSAGE_REACTION` (
    `ID`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
    `MESSAGE_ID` BIGINT UNSIGNED NOT NULL                COMMENT '메시지 ID (MESSAGE는 파티션 테이블이므로 FK 없음)',
    `USER_ID`    BIGINT UNSIGNED NOT NULL                COMMENT '반응한 사용자 ID',
    `EMOJI`      VARCHAR(16)     NOT NULL                COMMENT '이모지 문자',
    `CREATED_AT` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '반응 일시',
    PRIMARY KEY (`ID`),
    UNIQUE KEY `UK_MESSAGE_REACTION` (`MESSAGE_ID`, `USER_ID`, `EMOJI`),
    KEY `IDX_MESSAGE_REACTION_USER` (`USER_ID`),
    CONSTRAINT `FK_MESSAGE_REACTION_USER`
        FOREIGN KEY (`USER_ID`) REFERENCES `USER`(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='메시지 이모지 반응 (1 메시지 × 1 유저 × 1 이모지 = 고유)';


-- =============================================================================
-- 13. HAND_RAISE (그룹 채팅 손들기)
-- 담당: 팀 B | 관련 기능: B8 ★ 차별 기능
-- =============================================================================
CREATE TABLE IF NOT EXISTS `HAND_RAISE` (
    `ID`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
    `MESSAGE_ID`   BIGINT UNSIGNED NOT NULL                COMMENT '대상 메시지 ID (ASK 톤)',
    `ROOM_ID`      BIGINT UNSIGNED NOT NULL                COMMENT '방 ID (조회 최적화)',
    `RESPONDER_ID` BIGINT UNSIGNED NOT NULL                COMMENT '손든 사용자 ID',
    `STATUS`       ENUM('RAISED','PASSED','ANSWERED') NOT NULL DEFAULT 'RAISED' COMMENT '상태',
    `CREATED_AT`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '손든 일시',
    `UPDATED_AT`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '상태 변경 일시',
    PRIMARY KEY (`ID`),
    UNIQUE KEY `UK_HAND_RAISE` (`MESSAGE_ID`, `RESPONDER_ID`),
    KEY `IDX_HAND_RAISE_ROOM` (`ROOM_ID`),
    CONSTRAINT `FK_HAND_RAISE_ROOM`
        FOREIGN KEY (`ROOM_ID`) REFERENCES `ROOM`(`ID`) ON DELETE CASCADE,
    CONSTRAINT `FK_HAND_RAISE_USER`
        FOREIGN KEY (`RESPONDER_ID`) REFERENCES `USER`(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='그룹 채팅 ASK 톤 메시지 손들기 (MESSAGE FK 없음 - 파티션 테이블)';


-- =============================================================================
-- 14. PRESENCE_SNAPSHOT (프레즌스 마지막 세션 기록)
-- 담당: 팀 C | 관련 기능: C5, C6 ★ 차별 기능
-- 저장소 주의
--   실시간 상태 → Redis 전용 (key: presence:{USER_ID}, TTL 60초)
--   하트비트   → Redis SETEX 반복
--   이 테이블은 "마지막 오프라인 전환 시각" 같은 영구 기록만 남김
-- =============================================================================
CREATE TABLE IF NOT EXISTS `PRESENCE_SNAPSHOT` (
    `USER_ID`             BIGINT UNSIGNED NOT NULL                COMMENT '사용자 ID (PK)',
    `LAST_STATUS`         ENUM('FREE','WORKING','FOCUS','OFF') NOT NULL DEFAULT 'OFF' COMMENT '마지막 관측 상태',
    `LAST_ONLINE_AT`      DATETIME        NULL                    COMMENT '마지막 온라인 시각',
    `LAST_FOCUS_START_AT` DATETIME        NULL                    COMMENT '마지막 집중 모드 시작',
    `UPDATED_AT`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '업데이트 일시',
    PRIMARY KEY (`USER_ID`),
    CONSTRAINT `FK_PRESENCE_SNAPSHOT_USER`
        FOREIGN KEY (`USER_ID`) REFERENCES `USER`(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='프레즌스 마지막 세션 기록 (실시간은 Redis, 이 테이블은 DB 전용 지표용)';


-- =============================================================================
-- 15. FOCUS_SESSION (집중 모드 세션)
-- 담당: 팀 C | 관련 기능: C10 ★ 차별 기능
-- 중요: 이 테이블이 North Star 지표 (Weekly Deepwork Hours) 원천이므로 영구 보관
-- =============================================================================
CREATE TABLE IF NOT EXISTS `FOCUS_SESSION` (
    `ID`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
    `USER_ID`          BIGINT UNSIGNED NOT NULL                COMMENT '사용자 ID',
    `TASK_NAME`        VARCHAR(200)    NULL                    COMMENT '작업 이름',
    `SESSION_TYPE`     ENUM('POMODORO','CUSTOM','CALENDAR') NOT NULL DEFAULT 'POMODORO' COMMENT '세션 유형',
    `PLANNED_MINUTES`  INT UNSIGNED    NOT NULL DEFAULT 25     COMMENT '계획 집중 시간 (분)',
    `STARTED_AT`       DATETIME        NOT NULL                COMMENT '시작 일시',
    `ENDED_AT`         DATETIME        NULL                    COMMENT '종료 일시',
    `COMPLETED`        BOOLEAN         NOT NULL DEFAULT FALSE  COMMENT '완주 여부',
    `INTERRUPTION_CNT` INT UNSIGNED    NOT NULL DEFAULT 0      COMMENT '세션 중 방해 횟수',
    `CREATED_AT`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
    PRIMARY KEY (`ID`),
    KEY `IDX_FOCUS_USER_STARTED` (`USER_ID`, `STARTED_AT`),
    KEY `IDX_FOCUS_USER_COMPLETED` (`USER_ID`, `COMPLETED`),
    CONSTRAINT `FK_FOCUS_SESSION_USER`
        FOREIGN KEY (`USER_ID`) REFERENCES `USER`(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='집중 모드 세션 (North Star 지표 원천, 영구 보관)';


-- =============================================================================
-- 16. NOTIFICATION (알림 기록 - MVP 단계)
-- 담당: 팀 C | 관련 기능: C7, C8 ★ 차별 기능
-- 이전 경로
--   - Phase 1~3 (MVP)  : 이 테이블 사용, 디버깅·재전송용
--   - Phase 4 (DAU 5k+): ClickHouse로 이전, MySQL은 30일치만 유지
--   - 대기 큐는 처음부터 BullMQ (DB에 저장 안 함)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `NOTIFICATION` (
    `ID`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
    `USER_ID`          BIGINT UNSIGNED NOT NULL                COMMENT '수신자 사용자 ID',
    `MESSAGE_ID`       BIGINT UNSIGNED NOT NULL                COMMENT '알림 대상 메시지 ID',
    `DELIVERY_METHOD`  ENUM('IMMEDIATE','BATCHED','QUEUED','DROPPED') NOT NULL COMMENT '전달 방식',
    `DELIVERY_STATUS`  ENUM('PENDING','DELIVERED','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING' COMMENT '전달 상태',
    `TRIGGER_TONE`     ENUM('CHAT','ASK','URGENT','SHARE')     NOT NULL COMMENT '알림 시 톤',
    `TRIGGER_PRESENCE` ENUM('FREE','WORKING','FOCUS','OFF')    NOT NULL COMMENT '알림 시 수신자 프레즌스',
    `SCHEDULED_AT`     DATETIME        NULL                    COMMENT '예정 발송 시각',
    `DELIVERED_AT`     DATETIME        NULL                    COMMENT '실제 발송 시각',
    `CREATED_AT`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
    PRIMARY KEY (`ID`),
    KEY `IDX_NOTIF_USER_CREATED` (`USER_ID`, `CREATED_AT`),
    KEY `IDX_NOTIF_MESSAGE` (`MESSAGE_ID`),
    KEY `IDX_NOTIF_SCHEDULED` (`DELIVERY_STATUS`, `SCHEDULED_AT`),
    CONSTRAINT `FK_NOTIFICATION_USER`
        FOREIGN KEY (`USER_ID`) REFERENCES `USER`(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='알림 발사 기록 (MVP: DB, Phase4+: ClickHouse 이전 예정, 30일 초과분 cron 삭제)';


-- =============================================================================
-- 17. NOTIFICATION_PREFERENCE (알림 설정)
-- 담당: 팀 C | 관련 기능: A10, C14
-- =============================================================================
CREATE TABLE IF NOT EXISTS `NOTIFICATION_PREFERENCE` (
    `USER_ID`               BIGINT UNSIGNED NOT NULL                COMMENT '사용자 ID (PK)',
    `BATCH_INTERVAL_MIN`    INT UNSIGNED    NOT NULL DEFAULT 120    COMMENT '배치 주기 (분)',
    `ALLOW_URGENT_IN_FOCUS` BOOLEAN         NOT NULL DEFAULT TRUE   COMMENT '집중 모드 중 급함 허용',
    `SOUND_CHAT`            VARCHAR(50)     NULL                    COMMENT '수다 톤 알림음',
    `SOUND_ASK`             VARCHAR(50)     NULL                    COMMENT '물어봄 톤 알림음',
    `SOUND_URGENT`          VARCHAR(50)     NULL                    COMMENT '급함 톤 알림음',
    `SOUND_SHARE`           VARCHAR(50)     NULL                    COMMENT '공유 톤 알림음',
    `OS_NOTIFICATION`       BOOLEAN         NOT NULL DEFAULT TRUE   COMMENT 'OS 네이티브 알림 사용',
    `IN_APP_TOAST`          BOOLEAN         NOT NULL DEFAULT TRUE   COMMENT '앱 내부 토스트 사용',
    `UPDATED_AT`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시',
    PRIMARY KEY (`USER_ID`),
    CONSTRAINT `FK_NOTIF_PREF_USER`
        FOREIGN KEY (`USER_ID`) REFERENCES `USER`(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='사용자 알림 설정 (전역 기본값, 자주 읽힘 → Redis 캐싱 대상)';


-- =============================================================================
-- 18. FEED_ACTION (피드 카드 사용자 액션)
-- 담당: 팀 C | 관련 기능: C13
-- Phase 4+에는 ClickHouse로 이전 (분석 이벤트 성격)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `FEED_ACTION` (
    `ID`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
    `USER_ID`    BIGINT UNSIGNED NOT NULL                COMMENT '사용자 ID',
    `MESSAGE_ID` BIGINT UNSIGNED NOT NULL                COMMENT '관련 메시지 ID',
    `ACTION`     ENUM('REPLY_NOW','LATER','MARK_READ','DISMISS','OPEN_CHAT') NOT NULL COMMENT '액션',
    `CREATED_AT` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '액션 일시',
    PRIMARY KEY (`ID`),
    KEY `IDX_FEED_ACTION_USER_CREATED` (`USER_ID`, `CREATED_AT`),
    KEY `IDX_FEED_ACTION_MESSAGE` (`MESSAGE_ID`),
    CONSTRAINT `FK_FEED_ACTION_USER`
        FOREIGN KEY (`USER_ID`) REFERENCES `USER`(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='피드 액션 로그 (Phase 4+ ClickHouse 이전 예정, 30일 초과분 cron 삭제)';


-- =============================================================================
-- 19. DEVICE_SESSION (활성 디바이스 세션)
-- 담당: 팀 A | 관련 기능: A13
-- =============================================================================
CREATE TABLE IF NOT EXISTS `DEVICE_SESSION` (
    `ID`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
    `USER_ID`        BIGINT UNSIGNED NOT NULL                COMMENT '사용자 ID',
    `DEVICE_NAME`    VARCHAR(100)    NULL                    COMMENT '디바이스 이름',
    `PLATFORM`       ENUM('MACOS','WINDOWS','LINUX','WEB')   NOT NULL COMMENT '플랫폼',
    `APP_VERSION`    VARCHAR(20)     NULL                    COMMENT '앱 버전',
    `LAST_ACTIVE_AT` DATETIME        NOT NULL                COMMENT '마지막 활동 시각',
    `CREATED_AT`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '최초 로그인',
    PRIMARY KEY (`ID`),
    KEY `IDX_DEVICE_SESSION_USER_ACTIVE` (`USER_ID`, `LAST_ACTIVE_AT`),
    CONSTRAINT `FK_DEVICE_SESSION_USER`
        FOREIGN KEY (`USER_ID`) REFERENCES `USER`(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='활성 디바이스 세션 (설정에서 세션 관리 UI)';


SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 스키마 종료 (v2)
-- 총 19개 테이블 (v1의 22개에서 3개 제거)
--
-- 제거된 테이블 → 이전 경로
--   NOTIFICATION_QUEUE_ITEM  → BullMQ (Redis 기반 큐)
--   URGENT_QUOTA             → Redis (urgent:quota:{USER_ID}:{YYYYMMDD}, TTL 48h)
--   CATCHUP_FEED_CACHE       → Redis (feed:{USER_ID}, TTL 1h)
--   PRESENCE (완전 제거)     → PRESENCE_SNAPSHOT으로 대체, 실시간은 Redis
--
-- 외부 저장소 운영 가이드
--   Redis 키                   TTL       용도
--   room:seq:{ROOM_ID}        영구       메시지 SEQ 발급 (INCR)
--   presence:{USER_ID}        60초      실시간 프레즌스
--   urgent:quota:{UID}:{YMD}  48h       급함 쿼터 카운터
--   feed:{USER_ID}            1h        따라잡기 피드 캐시
--   typing:{ROOM_ID}:{UID}    5초       타이핑 인디케이터
--   read:{ROOM_ID}:{UID}      영구      읽음 SEQ (30초마다 DB 플러시)
--
--   BullMQ 큐 (Redis)
--   notification:immediate    즉시 발송 대상
--   notification:scheduled    배치·지연 발송 (delay 사용)
--
--   S3/R2
--   /attachments/{USER_ID}/{UUID}      이미지·첨부
--   /archive/messages/{YYYY-MM}.parquet 90일 초과 메시지
--
--   Meilisearch (Phase 3+)
--   messages  인덱스          메시지 본문 검색 (CDC로 sync)
--
--   ClickHouse (Phase 4+)
--   notification_events       NOTIFICATION 이전
--   feed_actions              FEED_ACTION 이전
-- =============================================================================
