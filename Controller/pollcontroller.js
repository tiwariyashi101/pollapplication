import mongoose from "mongoose";
import Poll from "../model/poll.js";
import Vote from "../model/vote.js";

const listPolls = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.min(50, parseInt(req.query.limit || "20"));
    const skip = (page - 1) * limit;
    const polls = await Poll.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    res.json({ success: true, data: polls });
  } catch (err) {
    next(err);
  }
};

const getPoll = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid poll id" });

    const poll = await Poll.findById(id).lean();
    if (!poll)
      return res
        .status(404)
        .json({ success: false, message: "Poll not found" });
    const vote = await Vote.findOne({ poll: id, user: req.user._id }).lean();
    res.json({
      success: true,
      data: { poll, voted: !!vote, votedOptionId: vote ? vote.optionId : null },
    });
  } catch (err) {
    next(err);
  }
};

const createPoll = async (req, res, next) => {
  try {
    const { title, description, options } = req.body;

    const opts = options
      .map((txt) => ({ text: String(txt).trim() }))
      .filter((o) => o.text);
    if (opts.length < 2)
      return res
        .status(400)
        .json({ success: false, message: "Provide at least 2 options" });

    const poll = await Poll.create({
      title,
      description,
      options: opts,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: poll });
  } catch (err) {
    next(err);
  }
};

const updatePoll = async (req, res, next) => {
  try {
    const pollId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(pollId))
      return res.status(400).json({ success: false, message: "Invalid id" });

    const poll = await Poll.findById(pollId);
    if (!poll)
      return res
        .status(404)
        .json({ success: false, message: "Poll not found" });
    if (!poll.createdBy.equals(req.user._id))
      return res.status(403).json({ success: false, message: "Not the owner" });

    const totalVotes = poll.options.reduce((s, o) => s + (o.votes || 0), 0);
    if (totalVotes > 0) {
      return res.status(403).json({
        success: false,
        message: "Cannot edit poll once voting has started",
      });
    }

    const { title, description, options } = req.body;
    if (title) poll.title = title;
    if (typeof description !== "undefined") poll.description = description;
    if (Array.isArray(options) && options.length >= 2) {
      poll.options = options.map((txt) => ({
        text: String(txt).trim(),
        votes: 0,
      }));
    }

    await poll.save();
    res.json({ success: true, data: poll });
  } catch (err) {
    next(err);
  }
};

const deletePoll = async (req, res, next) => {
  try {
    const pollId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(pollId))
      return res.status(400).json({ success: false, message: "Invalid id" });
    const poll = await Poll.findById(pollId);
    if (!poll)
      return res
        .status(404)
        .json({ success: false, message: "Poll not found" });
    if (!poll.createdBy.equals(req.user._id))
      return res.status(403).json({ success: false, message: "Not the owner" });

    await Vote.deleteMany({ poll: poll._id });
    await poll.deleteOne();
    res.json({ success: true, message: "Poll deleted" });
  } catch (err) {
    next(err);
  }
};

const listMyPolls = async (req, res, next) => {
  try {
    const polls = await Poll.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: polls });
  } catch (err) {
    next(err);
  }
};

const voteOnPoll = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const pollId = req.params.id;
    const userId = req.user._id;
    const { optionId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(pollId) ||
      !mongoose.Types.ObjectId.isValid(optionId)
    ) {
      return res.status(400).json({ success: false, message: "Invalid ids" });
    }

    let useTransaction = false;

    const conn = mongoose.connection;
    if (
      conn.readyState &&
      conn.client &&
      conn.client.topology &&
      conn.client.topology.s &&
      conn.client.topology.s.replicaset
    ) {
      useTransaction = true;
    }

    if (useTransaction) {
      await session.withTransaction(async () => {
        await Vote.create([{ user: userId, poll: pollId, optionId }], {
          session,
        });
        const updated = await Poll.findOneAndUpdate(
          { _id: pollId, "options._id": optionId },
          { $inc: { "options.$.votes": 1 } },
          { new: true, session }
        );
        if (!updated) throw new Error("Poll or option not found");
      });
    } else {
      const vote = new Vote({ user: userId, poll: pollId, optionId });
      await vote.save();

      const updated = await Poll.findOneAndUpdate(
        { _id: pollId, "options._id": optionId },
        { $inc: { "options.$.votes": 1 } },
        { new: true }
      );
      if (!updated) {
        await Vote.deleteOne({ _id: vote._id }).catch(() => {});
        return res
          .status(400)
          .json({ success: false, message: "Poll or option not found" });
      }
    }

    const poll = await Poll.findById(pollId).lean();
    res.json({ success: true, message: "Vote recorded", data: poll });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already voted for this poll",
      });
    }
    next(err);
  } finally {
    session.endSession();
  }
};
export {
  listPolls,
  getPoll,
  createPoll,
  updatePoll,
  deletePoll,
  listMyPolls,
  voteOnPoll,
};
