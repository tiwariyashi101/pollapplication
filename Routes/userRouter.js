import express from "express";
import { body, validationResult } from "express-validator";
import authController from "../controllers/authController.js";

const router = express.Router();

router.post("/signup",
  body("name").isLength({ min: 2 }),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    return authController.signup(req, res, next);
  }
);

router.post("/login",
  body("email").isEmail(),
  body("password").exists(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    return authController.login(req, res, next);
  }
);

export default router;