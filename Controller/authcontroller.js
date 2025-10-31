import jwt from "jsonwebtoken";
import User from "../model/user.js";

function signJwt(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists)
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    const user = await User.create({ name, email, password });
    const token = signJwt(user._id);
    res.json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    const ok = await user.comparePassword(password);
    if (!ok)
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    const token = signJwt(user._id);
    res.json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
};
export default { login, signup };
