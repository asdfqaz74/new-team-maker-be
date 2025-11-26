"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = exports.create = exports.findByEmail = exports.findById = void 0;
const user_model_1 = __importDefault(require("@/models/user.model"));
const findById = async (userId) => {
    return await user_model_1.default.findById(userId);
};
exports.findById = findById;
const findByEmail = async (email) => {
    return await user_model_1.default.findOne({ email });
};
exports.findByEmail = findByEmail;
const create = async (userData) => {
    const user = new user_model_1.default(userData);
    return await user.save();
};
exports.create = create;
const update = async (userId, updateData) => {
    return await user_model_1.default.findByIdAndUpdate(userId, updateData, { new: true });
};
exports.update = update;
