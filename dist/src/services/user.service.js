"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.loginUser = exports.registerUser = void 0;
const userRepository = __importStar(require("@/repositories/user.repository"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const registerUser = async (userData) => {
    // 1. 이메일 중복 확인
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
        throw new Error("이미 존재하는 이메일입니다.");
    }
    // 2. 비밀번호 암호화
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashedPassword = await bcryptjs_1.default.hash(userData.password, salt);
    // 3. 유저 생성
    const newUser = await userRepository.create({
        ...userData,
        password: hashedPassword,
    });
    return newUser;
};
exports.registerUser = registerUser;
const loginUser = async (email, password) => {
    // 1. 유저 확인
    const user = await userRepository.findByEmail(email);
    if (!user) {
        throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    // 2. 비밀번호 확인
    const isMatch = await bcryptjs_1.default.compare(password, user.password);
    if (!isMatch) {
        throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    // 3. 토큰 생성
    const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET || "secret", {
        expiresIn: "1d",
    });
    return { user, token };
};
exports.loginUser = loginUser;
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
exports.updateUser = updateUser;
