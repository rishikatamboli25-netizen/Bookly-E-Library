import express from "express";
import cors from "cors";
import authRoutes from "./Routes/authRoutes.js";
import bookRoutes from "./Routes/bookRoutes.js";
import userRoutes from "./Routes/userRoutes.js";
import mongoose from "mongoose";
import "dotenv/config";
const app = express();

const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/book",bookRoutes);
app.use("/api/users",userRoutes)


app.get("/api", (req, res) => {
  res.send("Hello Rishika");
});

console.log(process.env.MONGODB_URI)

mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("connected to db");
  app.listen(PORT, () => {
    console.log(`Server Running on ${PORT}`);
  });
});
