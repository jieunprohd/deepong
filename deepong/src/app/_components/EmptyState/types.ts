export type EmptyStateVariant =
  | "connect"
  | "celebrate"
  | "quiet"
  | "no-search"
  | "empty-feed"
  | "offline";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

export interface EmptyStateProps {
  /**
   * 빈 상태의 성격에 따른 테마와 일러스트를 결정합니다.
   */
  variant: EmptyStateVariant;
  /**
   * 메인 제목 (미입력 시 variant별 기본값 적용)
   */
  title?: string;
  /**
   * 상세 설명 (미입력 시 variant별 기본값 적용)
   */
  description?: string;
  /**
   * 주요 버튼 액션
   */
  action?: EmptyStateAction;
  /**
   * 보조 버튼 액션
   */
  secondaryAction?: EmptyStateAction;
  /**
   * 하단에 표시될 작은 힌트 칩 (미입력 시 variant별 기본값 적용)
   */
  hint?: string;
  /**
   * 추가적인 스타일링을 위한 클래스
   */
  className?: string;
}
