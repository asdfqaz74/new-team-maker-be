const User = require("../models/user.model");

const findById = async (userId) => {
  return await User.findById(userId);
};

const findByEmail = async (email) => {
  return await User.findOne({ email });
};

const create = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

const update = async (userId, updateData) => {
  return await User.findByIdAndUpdate(userId, updateData, { new: true });
};

module.exports = {
  findById,
  findByEmail,
  create,
  update,
};
