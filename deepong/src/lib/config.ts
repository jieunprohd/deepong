/**
 * 앱 전역 설정. 빌드 타임에 NEXT_PUBLIC_* 환경변수가 바인딩된다.
 *
 * 배포별 값:
 *  - 로컬 개발:           http://localhost:4000/api/v1 (env 미지정 시 기본값)
 *  - VM 운영(Caddy + IP): http://34.64.227.23/api/v1
 *  - 도메인 + HTTPS:      https://your-domain.duckdns.org/api/v1
 */
export const API_BASE: string =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000/api/v1";

/** OAuth 리다이렉트는 /api/v1 prefix 없이 사용 — API_BASE에서 prefix 제거 */
export const API_ORIGIN: string = API_BASE.replace(/\/api\/v1\/?$/, "");
