import * as userRepository from "@/repositories/user.repository";
import { IUser, IUserWaitPlayer } from "@/models/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ServiceError, ErrorCode } from "@/errors";
import type { RegisterUserData } from "@/dto/register-user.dto";

type UserRole = "owner" | "viewer";

interface LoginResult {
  user: IUser;
  accessToken: string;
  refreshToken: string;
  role: UserRole;
}

interface TokenPayload {
  id: string;
  role?: UserRole;
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
  // 1. 메인 계정으로 로그인 시도
  let user = await userRepository.findByUserId(userId);
  let role: UserRole = "owner";

  // 2. 메인 계정이 없으면 서브 계정으로 시도
  if (!user) {
    user = await userRepository.findBySubAccountId(userId);
    if (user && user.subAccount?.isEnabled) {
      // 서브 계정 비밀번호 확인
      const isMatch = await bcrypt.compare(password, user.subAccount.password);
      if (!isMatch) {
        throw new ServiceError(ErrorCode.INVALID_CREDENTIALS);
      }
      role = "viewer";
    } else {
      throw new ServiceError(ErrorCode.INVALID_CREDENTIALS);
    }
  } else {
    // 메인 계정 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ServiceError(ErrorCode.INVALID_CREDENTIALS);
    }
  }

  // 3. 토큰 생성 (role 포함)
  const accessToken = jwt.sign(
    { id: user._id, role },
    process.env.JWT_SECRET || "secret",
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );

  const refreshToken = jwt.sign(
    { id: user._id, role },
    process.env.JWT_REFRESH_SECRET || "refresh-secret",
    { expiresIn: REFRESH_TOKEN_EXPIRES }
  );

  // 4. 비밀번호 제외하고 반환
  const userWithoutPassword = user.toObject();
  delete userWithoutPassword.password;
  if (userWithoutPassword.subAccount) {
    delete userWithoutPassword.subAccount.password;
  }

  return {
    user: userWithoutPassword as IUser,
    accessToken,
    refreshToken,
    role,
  };
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

    // 3. 새 Access Token 발급 (role 유지)
    const accessToken = jwt.sign(
      { id: user._id, role: decoded.role || "owner" },
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

/* -------------------------------------------- */
/*                서브 계정 생성                     */
/* -------------------------------------------- */
export const createSubAccount = async (
  userId: string,
  subId: string,
  password: string
): Promise<IUser> => {
  // 1. 유저 확인
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ServiceError(ErrorCode.USER_NOT_FOUND);
  }

  // 2. 이미 서브 계정이 있는지 확인
  if (user.subAccount?.subId) {
    throw new ServiceError(ErrorCode.SUB_ACCOUNT_ALREADY_EXISTS);
  }

  // 3. 서브 계정 ID 중복 체크 (다른 유저의 서브 계정과 중복 방지)
  const existsSubId = await userRepository.existsSubAccountId(subId);
  if (existsSubId) {
    throw new ServiceError(ErrorCode.SUB_ACCOUNT_ID_ALREADY_EXISTS);
  }

  // 4. 메인 계정 ID와 중복 체크
  const existsUserId = await userRepository.findByUserId(subId);
  if (existsUserId) {
    throw new ServiceError(ErrorCode.SUB_ACCOUNT_ID_ALREADY_EXISTS);
  }

  // 5. 비밀번호 해싱
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 6. 서브 계정 저장
  const updatedUser = await userRepository.update(userId, {
    subAccount: {
      subId,
      password: hashedPassword,
      isEnabled: true,
    },
  });

  if (!updatedUser) {
    throw new ServiceError(ErrorCode.USER_NOT_FOUND);
  }

  const userWithoutPassword = updatedUser.toObject();
  delete userWithoutPassword.password;
  if (userWithoutPassword.subAccount) {
    delete userWithoutPassword.subAccount.password;
  }

  return userWithoutPassword as IUser;
};

/* -------------------------------------------- */
/*                서브 계정 삭제                     */
/* -------------------------------------------- */
export const deleteSubAccount = async (userId: string): Promise<IUser> => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ServiceError(ErrorCode.USER_NOT_FOUND);
  }

  if (!user.subAccount?.subId) {
    throw new ServiceError(ErrorCode.SUB_ACCOUNT_NOT_FOUND);
  }

  const updatedUser = await userRepository.update(userId, {
    $unset: { subAccount: 1 },
  } as any);

  if (!updatedUser) {
    throw new ServiceError(ErrorCode.USER_NOT_FOUND);
  }

  const userWithoutPassword = updatedUser.toObject();
  delete userWithoutPassword.password;

  return userWithoutPassword as IUser;
};

/* -------------------------------------------- */
/*                  유저 대기명단 추가                  */
/* -------------------------------------------- */
export const addUserWaitPlayer = async (
  userId: string,
  playerId: string,
  playerName: string
): Promise<IUserWaitPlayer[]> => {
  // 1. 유저 확인
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ServiceError(ErrorCode.USER_NOT_FOUND);
  }

  // 2. 대기명단에 이미 있는지 확인
  const existingPlayer = await userRepository.findWaitPlayer(userId, playerId);
  if (existingPlayer) {
    throw new ServiceError(ErrorCode.WAIT_PLAYER_ALREADY_EXISTS);
  }

  // 3. 대기명단에 추가
  const updatedUser = await userRepository.addWaitPlayer(
    userId,
    playerId,
    playerName
  );

  if (!updatedUser) {
    throw new ServiceError(ErrorCode.USER_NOT_FOUND);
  }

  return updatedUser.waitPlayers;
};

/* -------------------------------------------- */
/*                 유저 대기명단 불러오기                 */
/* -------------------------------------------- */
export const getUserWaitPlayers = async (
  userId: string
): Promise<IUser["waitPlayers"]> => {
  // 1. 유저 확인
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ServiceError(ErrorCode.USER_NOT_FOUND);
  }
  return user.waitPlayers;
};

/* -------------------------------------------- */
/*                  유저 대기명단 삭제                  */
/* -------------------------------------------- */
export const removeUserWaitPlayer = async (
  userId: string,
  playerId: string
): Promise<IUserWaitPlayer[]> => {
  // 1. 유저 확인
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ServiceError(ErrorCode.USER_NOT_FOUND);
  }

  // 2. 대기명단에서 플레이어 제거 ($pull 사용)
  const updatedUser = await userRepository.removeWaitPlayer(userId, playerId);

  if (!updatedUser) {
    throw new ServiceError(ErrorCode.USER_NOT_FOUND);
  }

  return updatedUser.waitPlayers;
};
