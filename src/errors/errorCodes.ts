// 에러 코드 정의
export const ErrorCode = {
  // 인증 관련
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  INVALID_EMAIL_FORMAT: "INVALID_EMAIL_FORMAT",
  USERID_ALREADY_EXISTS: "USERID_ALREADY_EXISTS",
  INVALID_USERID_FORMAT: "INVALID_USERID_FORMAT",
  INVALID_PASSWORD_FORMAT: "INVALID_PASSWORD_FORMAT",
  PASSWORD_MISMATCH: "PASSWORD_MISMATCH",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",

  // 유저 관련
  USER_NOT_FOUND: "USER_NOT_FOUND",

  // 공통
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// 에러 코드별 기본 메시지 (서버 로깅/디버깅용)
export const ErrorMessages: Record<ErrorCodeType, string> = {
  EMAIL_ALREADY_EXISTS: "이미 존재하는 이메일입니다.",
  INVALID_EMAIL_FORMAT: "유효한 이메일 형식이 아닙니다.",
  USERID_ALREADY_EXISTS: "사용할 수 없는 아이디입니다.",
  INVALID_USERID_FORMAT:
    "아이디는 영소문자와 숫자만 허용하며, 8~15자여야 합니다.",
  INVALID_PASSWORD_FORMAT:
    "비밀번호는 최소 8자, 최대 15자이며, 하나의 대문자, 하나의 소문자, 하나의 숫자, 하나의 특수문자를 포함해야 합니다.",
  PASSWORD_MISMATCH: "비밀번호와 비밀번호 확인이 일치하지 않습니다.",
  INVALID_CREDENTIALS: "이메일 또는 비밀번호가 올바르지 않습니다.",
  USER_NOT_FOUND: "존재하지 않는 유저입니다.",
  INTERNAL_SERVER_ERROR: "서버 내부 오류가 발생했습니다.",
  VALIDATION_ERROR: "입력값 검증에 실패했습니다.",
};
