import express from "express";
import { body, validationResult } from "express-validator";
import { requireAuth } from "../middlerware/auth";
import * as pollController from "../Controller/pollcontroller";

const router = express.Router();

router.get("/", requireAuth, pollController.listPolls);
router.get("/:id", requireAuth, pollController.getPoll);

router.post(
  "/",
  requireAuth,
  body("title").isLength({ min: 3 }),
  body("options").isArray({ min: 2 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });
    return pollController.createPoll(req, res, next);
  }
);

router.put("/:id", requireAuth, pollController.updatePoll);
router.delete("/:id", requireAuth, pollController.deletePoll);
router.get("/mine/list", requireAuth, pollController.listMyPolls);
router.post("/:id/vote", requireAuth, pollController.voteOnPoll);

export default router;
