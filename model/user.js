import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: 
  { type: String, 
    required: true, 
    trim: true },

  email: { 
    type: String, 
    required: true, 
    lowercase: true, unique: true, 
    trim: true },
  password: 
  { type: String, 
    required: true },
}, { timestamps: true });


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return await bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);