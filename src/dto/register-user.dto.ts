import { ErrorCode, ServiceError } from "@/errors";
import {
  validateEmail,
  validatePassword,
  validateUserId,
} from "utils/validateRegister";

// Service에서 사용할 타입 (passwordConfirm 제외)
export interface RegisterUserData {
  email: string;
  password: string;
  realName: string;
  userId: string;
}

export class RegisterUserDTO {
  email: string;
  password: string;
  passwordConfirm: string;
  realName: string;
  userId: string;

  constructor(body: any) {
    this.email = body.email;
    this.password = body.password;
    this.passwordConfirm = body.passwordConfirm;
    this.realName = body.realName;
    this.userId = body.userId;
  }

  sanitize() {
    this.email = this.email.trim().toLowerCase();
    this.userId = this.userId.trim();
    this.realName = this.realName.trim();
  }

  // Service에 전달할 데이터 (passwordConfirm 제외)
  toServiceData(): RegisterUserData {
    return {
      email: this.email,
      password: this.password,
      realName: this.realName,
      userId: this.userId,
    };
  }

  validate() {
    if (!validateEmail(this.email)) {
      throw new ServiceError(ErrorCode.INVALID_EMAIL_FORMAT);
    }

    if (!validateUserId(this.userId)) {
      throw new ServiceError(ErrorCode.INVALID_USERID_FORMAT);
    }

    if (!validatePassword(this.password)) {
      throw new ServiceError(ErrorCode.INVALID_PASSWORD_FORMAT);
    }

    if (this.password !== this.passwordConfirm) {
      throw new ServiceError(ErrorCode.PASSWORD_MISMATCH);
    }
  }
}
