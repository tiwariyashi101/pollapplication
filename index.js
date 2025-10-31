import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import dbConnect from "./database/dbconnect.js";
import authRouter from "./Routes/userRouter.js";
import pollRouter from "./Routes/pollRouter.js";

// ✅ Connect to MongoDB before starting the server
dbConnect();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Routes
app.use("/api/auth", authRouter);
app.use("/api/polls", pollRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server error",
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
