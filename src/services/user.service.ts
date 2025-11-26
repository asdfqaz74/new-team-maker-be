import * as userRepository from "@/repositories/user.repository";
import { IUser } from "@/models/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ServiceError, ErrorCode } from "@/errors";
import type { RegisterUserData } from "@/dto/register-user.dto";

interface LoginResult {
  user: IUser;
  token: string;
}

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
  email: string,
  password: string
): Promise<LoginResult> => {
  // 1. 유저 확인
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new ServiceError(ErrorCode.INVALID_CREDENTIALS);
  }

  // 2. 비밀번호 확인
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ServiceError(ErrorCode.INVALID_CREDENTIALS);
  }

  // 3. 토큰 생성
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", {
    expiresIn: "1d",
  });

  return { user, token };
};

/* -------------------------------------------- */
/*                 유저 정보 수정 서비스                 */
/* -------------------------------------------- */
export const updateUser = async (
  userId: string,
  updateData: Partial<IUser>
): Promise<IUser | null> => {
  // 유저 존재 여부 확인
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ServiceError(ErrorCode.USER_NOT_FOUND);
  }

  // 업데이트 수행
  // 비밀번호 변경 등의 로직이 필요하다면 여기서 처리 (예: 해싱)
  // 지금은 단순 정보 수정만 구현
  const updatedUser = await userRepository.update(userId, updateData);
  return updatedUser;
};
