import express from "express";

import {
  registerUser,
  deleteUser,
  checkUser,
  loginUser,
} from "../controllers/authcontroller.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/delete", deleteUser);

router.post("/check-email", checkUser);

export default router;