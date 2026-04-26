import { ToneType } from "../Chip/types";

export interface MessageComposerProps {
  /** 현재 선택된 톤 */
  tone: ToneType;
  /** 톤 변경 시 콜백 */
  onToneChange: (tone: ToneType) => void;
  /** 메시지 전송 시 콜백 */
  onSend: (message: string) => void;
  /** 이미지 첨부 버튼 클릭 시 콜백 */
  onAttachImage?: () => void;
  /** 입력창 플레이스홀더 */
  placeholder?: string;
  /** 로딩/전송 중 상태 */
  disabled?: boolean;
  /** 추가 클래스 */
  className?: string;
}
