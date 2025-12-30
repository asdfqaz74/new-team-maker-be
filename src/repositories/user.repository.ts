import User, { IUser, IUserWaitPlayer } from "@/models/user.model";

// MongoDB ObjectId로 찾기
export const findById = async (id: string): Promise<IUser | null> => {
  return await User.findById(id).select("-__v -createdAt -updatedAt");
};

// 계정 아이디(userId)로 찾기
export const findByUserId = async (userId: string): Promise<IUser | null> => {
  return await User.findOne({ userId }).select("-__v -createdAt -updatedAt");
};

// 서브 계정 아이디(subAccount.subId)로 찾기
export const findBySubAccountId = async (
  subId: string
): Promise<IUser | null> => {
  return await User.findOne({ "subAccount.subId": subId });
};

// 이메일로 찾기
export const findByEmail = async (email: string): Promise<IUser | null> => {
  return await User.findOne({ email });
};

// 유저 생성
export const create = async (userData: Partial<IUser>): Promise<IUser> => {
  const user = new User(userData);
  return await user.save();
};

// 유저 정보 업데이트
export const update = async (
  userId: string,
  updateData: Partial<IUser>
): Promise<IUser | null> => {
  return await User.findByIdAndUpdate(userId, updateData, { new: true });
};

// 서브 계정 ID 중복 체크
export const existsSubAccountId = async (subId: string): Promise<boolean> => {
  const user = await User.findOne({ "subAccount.subId": subId });
  return !!user;
};

// 유저 대기명단 플레이어 찾기 (중복 체크)
export const findWaitPlayer = async (
  userId: string,
  playerId: string
): Promise<boolean> => {
  const user = await User.findOne({ _id: userId, "waitPlayers.id": playerId });
  return !!user;
};

// 유저 대기명단 플레이어 추가
export const addWaitPlayer = async (
  userId: string,
  playerId: string,
  playerName: string
): Promise<IUser | null> => {
  return await User.findByIdAndUpdate(
    userId,
    { $push: { waitPlayers: { id: playerId, name: playerName } } },
    { new: true }
  );
};

// 유저 대기명단 불러오기
export const getWaitPlayers = async (
  userId: string
): Promise<IUserWaitPlayer[]> => {
  const user = await User.findById(userId).select("waitPlayers -_id").lean();

  return user?.waitPlayers ?? [];
};

// 유저 대기명단 플레이어 삭제
export const removeWaitPlayer = async (
  userId: string,
  playerId: string
): Promise<IUser | null> => {
  return await User.findByIdAndUpdate(
    userId,
    { $pull: { waitPlayers: { id: playerId } } },
    { new: true }
  );
};
