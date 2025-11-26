import { ErrorCodeType, ErrorMessages } from "./errorCodes";

export class ServiceError extends Error {
  public readonly code: ErrorCodeType;
  public readonly statusCode: number;

  constructor(code: ErrorCodeType, statusCode: number = 400) {
    super(ErrorMessages[code]);
    this.code = code;
    this.statusCode = statusCode;
    this.name = "ServiceError";

    // Error 클래스 상속 시 프로토타입 체인 유지
    Object.setPrototypeOf(this, ServiceError.prototype);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }
}
