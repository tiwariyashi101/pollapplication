import mongoose from "mongoose";

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  votes: { type: Number, default: 0 },
}, { _id: true });

const pollSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  options: { type: [optionSchema], validate: v => v.length >= 2 }, // at least 2 options
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.model("Poll", pollSchema);