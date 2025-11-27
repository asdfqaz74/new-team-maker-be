import * as userRepository from "@/repositories/user.repository";
import { IUser } from "@/models/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ServiceError, ErrorCode } from "@/errors";
import type { RegisterUserData } from "@/dto/register-user.dto";

interface LoginResult {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

interface TokenPayload {
  id: string;
}

// 토큰 만료 시간 설정
const ACCESS_TOKEN_EXPIRES = "15m"; // 15분
const REFRESH_TOKEN_EXPIRES = "7d"; // 7일

/* -------------------------------------------- */
/*                   유저 등록 서비스                  */
/* -------------------------------------------- */
export const registerUser = async (
  userData: RegisterUserData
): Promise<IUser> => {
  /* ------------------- 중복 검사 ------------------ */
  // 1. 이메일 중복 확인
  const existingUser = await userRepository.findByEmail(userData.email);
  if (existingUser) {
    throw new ServiceError(ErrorCode.EMAIL_ALREADY_EXISTS);
  }

  // 2. 아이디 중복 확인
  const existingUserId = await userRepository.findByUserId(userData.userId);
  if (existingUserId) {
    throw new ServiceError(ErrorCode.USERID_ALREADY_EXISTS);
  }

  /* ----------------- 비밀번호 해싱 ----------------- */
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  /* ----------------- 유저 정보 저장 ----------------- */
  const newUser = await userRepository.create({
    ...userData,
    password: hashedPassword,
  });

  return newUser;
};

/* -------------------------------------------- */
/*                   유저 로그인 서비스                  */
/* -------------------------------------------- */
export const loginUser = async (
  userId: string,
  password: string
): Promise<LoginResult> => {
  // 1. 유저 확인
  const user = await userRepository.findByUserId(userId);
  if (!user) {
    throw new ServiceError(ErrorCode.INVALID_CREDENTIALS);
  }

  // 2. 비밀번호 확인
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ServiceError(ErrorCode.INVALID_CREDENTIALS);
  }

  // 3. 토큰 생성
  const accessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || "secret",
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || "refresh-secret",
    { expiresIn: REFRESH_TOKEN_EXPIRES }
  );

  // 4. 비밀번호 제외하고 반환
  const userWithoutPassword = user.toObject();
  delete userWithoutPassword.password;

  return { user: userWithoutPassword as IUser, accessToken, refreshToken };
};

/* -------------------------------------------- */
/*              Refresh Token으로 재발급              */
/* -------------------------------------------- */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ accessToken: string }> => {
  try {
    // 1. Refresh Token 검증
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || "refresh-secret"
    ) as TokenPayload;

    // 2. 유저 존재 확인
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new ServiceError(ErrorCode.USER_NOT_FOUND);
    }

    // 3. 새 Access Token 발급
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: ACCESS_TOKEN_EXPIRES }
    );

    return { accessToken };
  } catch (error) {
    if (error instanceof ServiceError) {
      throw error;
    }
    throw new ServiceError(ErrorCode.INVALID_REFRESH_TOKEN);
  }
};

/* -------------------------------------------- */
/*                현재 유저 정보 조회                  */
/* -------------------------------------------- */
export const getCurrentUser = async (userId: string): Promise<IUser> => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ServiceError(ErrorCode.USER_NOT_FOUND);
  }

  const userWithoutPassword = user.toObject();
  delete userWithoutPassword.password;

  return userWithoutPassword as IUser;
};

/* -------------------------------------------- */
/*                 유저 정보 수정 서비스                 */
/* -------------------------------------------- */
export const updateUser = async (
  userId: string,
  updateData: Partial<IUser>
): Promise<IUser | null> => {
  // 유저 존재 여부 확인
  const user = await userRepository.findByUserId(userId);
  if (!user) {
    throw new ServiceError(ErrorCode.USER_NOT_FOUND);
  }

  // 업데이트 수행
  // 비밀번호 변경 등의 로직이 필요하다면 여기서 처리 (예: 해싱)
  // 지금은 단순 정보 수정만 구현
  const updatedUser = await userRepository.update(userId, updateData);
  return updatedUser;
};
