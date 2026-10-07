import express from "express";
import cors from "cors";
import authRoutes from "./Routes/authRoutes.js";
import bookRoutes from "./Routes/bookRoutes.js";
import userRoutes from "./Routes/userRoutes.js";
import imageRoutes from "./Routes/imageRoutes.js";
import mongoose from "mongoose";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration using FRONTEND_URL with localhost fallback
const allowedOrigins = (
  process.env.FRONTEND_URLS ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(
          new Error(
            `Not allowed by CORS: ${origin}`
          )
        );
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/book", bookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/images", imageRoutes);
app.get("/api", (req, res) => {
  res.send("Hello Rishika");
});



console.log(process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("connected to db");
  app.listen(PORT, () => {
    console.log(`Server Running on ${PORT}`);
  });
});