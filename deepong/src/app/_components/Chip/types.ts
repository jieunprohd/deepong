export type ChipVariant = "tone" | "filter" | "badge" | "status";

export type ToneType = "chat" | "ask" | "urgent" | "share";

export type PresenceType = "free" | "working" | "focus" | "off";

export interface ChipProps {
  /**
   * 칩의 기본 변형
   */
  variant?: ChipVariant;
  /**
   * 톤 변형일 때의 종류 (variant="tone" 혹은 "badge" 일 때 사용)
   */
  tone?: ToneType;
  /**
   * 상태 변형일 때의 프레즌스 종류 (variant="status" 일 때 사용)
   */
  presence?: PresenceType;
  /**
   * 상태 변형일 때 표시할 값 (예: "18", "오후 6:30")
   * focus일 때: "집중 모드 · {statusValue}분 남음"
   * working일 때: "일하는 중 · {statusValue}까지"
   */
  statusValue?: string;
  /**
   * 텍스트 라벨 (status 변형에서 statusValue가 있으면 무시될 수 있음)
   */
  label?: string;
  /**
   * 아이콘 (React 노드) - status 변형에서는 자동으로 생성됩니다.
   */
  icon?: React.ReactNode;
  /**
   * 필터 변형일 때 활성화 여부
   */
  active?: boolean;
  /**
   * 클릭 이벤트
   */
  onClick?: () => void;
  /**
   * 우측에 표시될 단축키 (kbd)
   */
  shortcut?: string;
  /**
   * 추가적인 스타일링을 위한 클래스
   */
  className?: string;
  /**
   * 사이즈 조절
   */
  size?: "sm" | "md";
}
