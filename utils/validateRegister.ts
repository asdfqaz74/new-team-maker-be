export const validateEmail = (email: string): boolean => {
  // 이메일 정규식 (RFC 5322 간소화 버전)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // 비밀번호는 최소 8자, 최대15자, 최소 하나의 대문자, 하나의 소문자, 하나의 숫자, 하나의 특수문자 포함
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,15}$/;

  return passwordRegex.test(password);
};

export const validateUserId = (userId: string): boolean => {
  // 아이디는 영소문자, 숫자만 허용하며 8~15자
  const userIdRegex = /^[a-z0-9]{8,15}$/;

  return userIdRegex.test(userId);
};
