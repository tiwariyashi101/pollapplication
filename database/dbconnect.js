import mongoose from "mongoose";

const dbConnect = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/pollapp")
     console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
  }
};

export default dbConnect;
