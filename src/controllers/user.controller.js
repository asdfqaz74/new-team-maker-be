const userService = require("../services/user.service");

const register = async (req, res) => {
  try {
    const userData = req.body;
    const newUser = await userService.registerUser(userData);

    res.status(201).json({
      success: true,
      data: newUser,
      message: "회원가입이 완료되었습니다.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await userService.loginUser(email, password);

    res.status(200).json({
      success: true,
      data: {
        user,
        token,
      },
      message: "로그인에 성공했습니다.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    const updatedUser = await userService.updateUser(userId, updateData);

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: "유저 정보가 성공적으로 업데이트 되었습니다.",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  updateUser,
};
