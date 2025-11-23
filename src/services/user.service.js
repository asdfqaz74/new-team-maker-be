const userRepository = require("../repositories/user.repository");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUser = async (userData) => {
  // 1. 이메일 중복 확인
  const existingUser = await userRepository.findByEmail(userData.email);
  if (existingUser) {
    throw new Error("이미 존재하는 이메일입니다.");
  }

  // 2. 비밀번호 암호화
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  // 3. 유저 생성
  const newUser = await userRepository.create({
    ...userData,
    password: hashedPassword,
  });

  return newUser;
};

const loginUser = async (email, password) => {
  // 1. 유저 확인
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  // 2. 비밀번호 확인
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  // 3. 토큰 생성
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", {
    expiresIn: "1d",
  });

  return { user, token };
};

const updateUser = async (userId, updateData) => {
  // 유저 존재 여부 확인
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error("존재하지 않는 유저입니다.");
  }

  // 업데이트 수행
  // 비밀번호 변경 등의 로직이 필요하다면 여기서 처리 (예: 해싱)
  // 지금은 단순 정보 수정만 구현
  const updatedUser = await userRepository.update(userId, updateData);
  return updatedUser;
};

module.exports = {
  registerUser,
  loginUser,
  updateUser,
};
