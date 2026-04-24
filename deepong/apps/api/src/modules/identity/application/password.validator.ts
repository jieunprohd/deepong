export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return '비밀번호는 8자 이상이어야 합니다.';
  }

  let categoryCount = 0;
  if (/[a-zA-Z]/.test(password)) categoryCount++;
  if (/[0-9]/.test(password)) categoryCount++;
  if (/[^a-zA-Z0-9]/.test(password)) categoryCount++;

  if (categoryCount < 2) {
    return '비밀번호는 영문, 숫자, 특수문자 중 2종 이상 포함해야 합니다.';
  }

  return null;
}
